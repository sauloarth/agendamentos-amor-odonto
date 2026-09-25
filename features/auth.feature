Feature: Authentication
  Anyone can sign up as a client and log in to get a JWT token
  that identifies them in protected routes.

  Scenario: A visitor signs up as a client
    When an anonymous user sends POST "/api/auth/register" with:
      """
      { "name": "Joao Silva", "email": "joao.silva@example.com", "password": "secret123", "phone": "11999990000" }
      """
    Then the response status should be 201
    And the response should contain:
      | name  | Joao Silva             |
      | email | joao.silva@example.com |
      | role  | client                 |
    And the response should have a "token"

  Scenario: Signing up with an e-mail already in use
    Given a client "joao"
    When an anonymous user sends POST "/api/auth/register" with:
      """
      { "name": "Another Joao", "email": "joao@test.com", "password": "secret123" }
      """
    Then the response status should be 400
    And the response message should be "E-mail já cadastrado"

  Scenario: Signing up with invalid data
    When an anonymous user sends POST "/api/auth/register" with:
      """
      { "name": "Joao", "email": "not-an-email", "password": "123" }
      """
    Then the response status should be 400
    And the validation errors should include field "email"
    And the validation errors should include field "password"

  Scenario: A registered user logs in
    Given a client "joao"
    When an anonymous user sends POST "/api/auth/login" with:
      """
      { "email": "joao@test.com", "password": "secret123" }
      """
    Then the response status should be 200
    And the response should contain:
      | _id  | {user:joao} |
      | role | client      |
    And the response should have a "token"

  Scenario Outline: Logging in with wrong credentials
    Given a client "joao"
    When an anonymous user sends POST "/api/auth/login" with:
      """
      { "email": "<email>", "password": "<password>" }
      """
    Then the response status should be 401
    And the response message should be "Credenciais inválidas"

    Examples:
      | email           | password       |
      | joao@test.com   | wrong-password |
      | nobody@test.com | secret123      |

  Scenario: A logged-in user fetches their own profile
    Given a professional "ana"
    When "ana" sends GET "/api/auth/me"
    Then the response status should be 200
    And the response should contain:
      | email | ana@test.com |
      | role  | professional |
    And the response should not have a "password"

  Scenario: Fetching the profile without a token
    When an anonymous user sends GET "/api/auth/me"
    Then the response status should be 401
    And the response message should be "Token não fornecido"

  Scenario: Fetching the profile with an invalid token
    When someone with an invalid token sends GET "/api/auth/me"
    Then the response status should be 401
    And the response message should be "Token inválido ou expirado"

  @known-bug
  Scenario: An invalid token on a public route is rejected
    When someone with an invalid token sends GET "/api/products"
    Then the response status should be 401
