Feature: Schedule blocks
  Blocks prevent appointments during a period. Professionals manage their
  own blocks; admins manage every block, including clinic-wide ones.

  Background:
    Given an admin "admin"
    And a professional "ana"
    And a professional "bruno"
    And a client "joao"

  Scenario: A professional blocks their own schedule
    When "ana" sends POST "/api/blocks" with:
      """
      {
        "type": "single",
        "reason": "Dentist appointment",
        "startDateTime": "{date:tomorrow at 13:00}",
        "endDateTime": "{date:tomorrow at 17:00}"
      }
      """
    Then the response status should be 201
    And the response should contain:
      | type          | single                  |
      | professional  | {user:ana}              |
      | active        | true                    |
      | startDateTime | {date:tomorrow at 13:00} |

  Scenario: A professional cannot block another professional's schedule
    When "ana" sends POST "/api/blocks" with:
      """
      {
        "type": "single",
        "professional": "{user:bruno}",
        "startDateTime": "{date:tomorrow at 13:00}",
        "endDateTime": "{date:tomorrow at 17:00}"
      }
      """
    Then the response status should be 403
    And the response message should be "Profissionais só podem criar bloqueios para si mesmos"

  Scenario: An admin creates a recurring clinic-wide block
    When "admin" sends POST "/api/blocks" with:
      """
      { "type": "recurring", "reason": "Lunch", "daysOfWeek": [1, 2, 3, 4, 5], "startTime": "12:00", "endTime": "13:00" }
      """
    Then the response status should be 201
    And the response should contain:
      | type         | recurring |
      | professional | null      |
      | startTime    | 12:00     |
      | endTime      | 13:00     |

  Scenario: An admin cannot block a user who is not a professional
    When "admin" sends POST "/api/blocks" with:
      """
      {
        "type": "single",
        "professional": "{user:joao}",
        "startDateTime": "{date:tomorrow at 13:00}",
        "endDateTime": "{date:tomorrow at 17:00}"
      }
      """
    Then the response status should be 400
    And the response message should be "Profissional inválido"

  Scenario: Creating a block that ends before it starts
    When "ana" sends POST "/api/blocks" with:
      """
      { "type": "recurring", "daysOfWeek": [1], "startTime": "14:00", "endTime": "13:00" }
      """
    Then the response status should be 400
    And the validation errors should include field "endTime"

  Scenario: Clients cannot see blocks
    When "joao" sends GET "/api/blocks"
    Then the response status should be 403

  Scenario: A professional only lists their own blocks
    Given a single block "ana-off" for "ana" from "tomorrow at 08:00" to "tomorrow at 12:00"
    And a single block "bruno-off" for "bruno" from "tomorrow at 08:00" to "tomorrow at 12:00"
    When "ana" sends GET "/api/blocks"
    Then the response status should be 200
    And the "_id" of the listed items should be:
      | {block:ana-off} |

  Scenario: An admin lists every block
    Given a single block "ana-off" for "ana" from "tomorrow at 08:00" to "tomorrow at 12:00"
    And a single block "bruno-off" for "bruno" from "tomorrow at 08:00" to "tomorrow at 12:00"
    And a single block "holiday" for the whole clinic from "in 5 days at 00:00" to "in 5 days at 23:59"
    When "admin" sends GET "/api/blocks"
    Then the response status should be 200
    And the response should be a list with 3 items

  Scenario: A professional cannot see another professional's block
    Given a single block "bruno-off" for "bruno" from "tomorrow at 08:00" to "tomorrow at 12:00"
    When "ana" sends GET "/api/blocks/{block:bruno-off}"
    Then the response status should be 404
    And the response message should be "Bloqueio não encontrado"

  Scenario: A professional deactivates their own block
    Given a single block "ana-off" for "ana" from "tomorrow at 08:00" to "tomorrow at 12:00"
    When "ana" sends PATCH "/api/blocks/{block:ana-off}" with:
      """
      { "active": false }
      """
    Then the response status should be 200
    And the response should contain:
      | active | false |

  Scenario: A professional cannot reassign a block
    Given a single block "ana-off" for "ana" from "tomorrow at 08:00" to "tomorrow at 12:00"
    When "ana" sends PATCH "/api/blocks/{block:ana-off}" with:
      """
      { "professional": "{user:bruno}" }
      """
    Then the response status should be 403
    And the response message should be "Profissionais não podem alterar o profissional responsável"

  Scenario: Updating a block to end before it starts
    Given a single block "ana-off" for "ana" from "tomorrow at 08:00" to "tomorrow at 12:00"
    When "ana" sends PATCH "/api/blocks/{block:ana-off}" with:
      """
      { "endDateTime": "{date:tomorrow at 07:00}" }
      """
    Then the response status should be 400
    And the response message should be "endDateTime deve ser posterior a startDateTime"
