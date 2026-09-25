Feature: User roles
  Admins turn clients into professionals and back.

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
