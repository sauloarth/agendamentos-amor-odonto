Feature: Users
  Admins list users and turn clients into professionals and back.

  Background:
    Given an admin "admin"
    And a client "joao"
    And a professional "ana"
    And a product "Cleaning" lasting 30 minutes costing 150 performed by "ana"

  Scenario: An admin promotes a client to professional
    When "admin" sends PATCH "/api/users/{user:joao}/role" with:
      """
      { "role": "professional" }
      """
    Then the response status should be 200
    And the response should contain:
      | _id  | {user:joao}  |
      | role | professional |
    And the response should not have a "password"

  Scenario: A professional who becomes a client is unlinked from products
    When "admin" sends PATCH "/api/users/{user:ana}/role" with:
      """
      { "role": "client" }
      """
    Then the response status should be 200
    When "admin" sends GET "/api/products/{product:Cleaning}"
    Then the response field "professionals" should have 0 items

  Scenario: The admin role cannot be granted through the API
    When "admin" sends PATCH "/api/users/{user:joao}/role" with:
      """
      { "role": "admin" }
      """
    Then the response status should be 400
    And the validation errors should include field "role"

  Scenario: Changing the role of an unknown user
    When "admin" sends PATCH "/api/users/000000000000000000000000/role" with:
      """
      { "role": "professional" }
      """
    Then the response status should be 404
    And the response message should be "Usuário não encontrado"

  Scenario Outline: Only admins can change roles
    When "<user>" sends PATCH "/api/users/{user:joao}/role" with:
      """
      { "role": "professional" }
      """
    Then the response status should be 403

    Examples:
      | user |
      | joao |
      | ana  |

  Scenario: An admin lists every user sorted by name
    When "admin" sends GET "/api/users"
    Then the response status should be 200
    And the "name" of the listed items should be:
      | admin |
      | ana   |
      | joao  |
    And the response should not have a "0.password"

  Scenario: An admin filters users by role
    When "admin" sends GET "/api/users?role=professional"
    Then the response status should be 200
    And the "_id" of the listed items should be:
      | {user:ana} |

  Scenario: An admin searches users by part of the name or e-mail
    Given a client "joana"
    When "admin" sends GET "/api/users?search=JOA"
    Then the "name" of the listed items should be:
      | joana |
      | joao  |
    When "admin" sends GET "/api/users?search=ana@test"
    Then the "name" of the listed items should be:
      | ana   |
      | joana |

  Scenario: Searching with regex characters matches them literally
    When "admin" sends GET "/api/users?search=.*"
    Then the response status should be 200
    And the response should be a list with 0 items

  Scenario: Filtering by an unknown role
    When "admin" sends GET "/api/users?role=dentist"
    Then the response status should be 400
    And the validation errors should include field "role"

  Scenario Outline: Only admins can list users
    When "<user>" sends GET "/api/users"
    Then the response status should be 403

    Examples:
      | user |
      | joao |
      | ana  |
