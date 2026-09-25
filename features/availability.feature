Feature: Availability
  Anyone can list the free slots of a professional for a product. Slots are
  consecutive, last as long as the product and skip everything unavailable.

  Background:
    Given a professional "ana"
    And a professional "bruno"
    And a client "joao"
    And a product "Cleaning" lasting 30 minutes costing 150 performed by "ana"

  Scenario: Every slot in a free period is available
    When an anonymous user sends GET "/api/availability?professionalId={user:ana}&productId={product:Cleaning}&dateStart={date:tomorrow at 08:00}&dateEnd={date:tomorrow at 10:00}"
    Then the response status should be 200
    And the "startDateTime" of the listed items should be:
      | {date:tomorrow at 08:00} |
      | {date:tomorrow at 08:30} |
      | {date:tomorrow at 09:00} |
      | {date:tomorrow at 09:30} |

  Scenario: Booked and blocked slots are excluded
    Given "joao" has an appointment "A1" with "ana" for "Cleaning" at "tomorrow at 08:30"
    And a single block "break" for "ana" from "tomorrow at 09:30" to "tomorrow at 10:00"
    When an anonymous user sends GET "/api/availability?professionalId={user:ana}&productId={product:Cleaning}&dateStart={date:tomorrow at 08:00}&dateEnd={date:tomorrow at 10:00}"
    Then the response status should be 200
    And the "startDateTime" of the listed items should be:
      | {date:tomorrow at 08:00} |
      | {date:tomorrow at 09:00} |

  Scenario: Past slots are excluded
    When an anonymous user sends GET "/api/availability?professionalId={user:ana}&productId={product:Cleaning}&dateStart={date:yesterday at 08:00}&dateEnd={date:yesterday at 10:00}"
    Then the response status should be 200
    And the response should be a list with 0 items

  Scenario: Slots never cross midnight
    When an anonymous user sends GET "/api/availability?professionalId={user:ana}&productId={product:Cleaning}&dateStart={date:tomorrow at 23:00}&dateEnd={date:in 2 days at 00:30}"
    Then the response status should be 200
    And the "startDateTime" of the listed items should be:
      | {date:tomorrow at 23:00}  |
      | {date:in 2 days at 00:00} |

  Scenario: The period cannot be longer than 90 days
    When an anonymous user sends GET "/api/availability?professionalId={user:ana}&productId={product:Cleaning}&dateStart={date:tomorrow at 08:00}&dateEnd={date:in 100 days at 08:00}"
    Then the response status should be 400
    And the validation errors should include field "dateEnd"

  Scenario: The period must end after it starts
    When an anonymous user sends GET "/api/availability?professionalId={user:ana}&productId={product:Cleaning}&dateStart={date:tomorrow at 10:00}&dateEnd={date:tomorrow at 08:00}"
    Then the response status should be 400
    And the validation errors should include field "dateEnd"

  Scenario: The professional must perform the product
    When an anonymous user sends GET "/api/availability?professionalId={user:bruno}&productId={product:Cleaning}&dateStart={date:tomorrow at 08:00}&dateEnd={date:tomorrow at 10:00}"
    Then the response status should be 400
    And the response message should be "Profissional não realiza este produto"

  Scenario: All parameters are required
    When an anonymous user sends GET "/api/availability"
    Then the response status should be 400
    And the validation errors should include field "professionalId"
    And the validation errors should include field "productId"
