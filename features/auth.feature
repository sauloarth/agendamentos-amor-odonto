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

  Scenario: An invalid token on a public route is rejected
    When someone with an invalid token sends GET "/api/products"
    Then the response status should be 401
    And the response message should be "Token inválido ou expirado"

  Scenario: An invalid token on the availability route is rejected
    When someone with an invalid token sends GET "/api/availability"
    Then the response status should be 401
    And the response message should be "Token inválido ou expirado"

  Scenario: A user updates their name and phone
    Given a client "joao"
    When "joao" sends PATCH "/api/auth/me" with:
      """
      { "name": "João Silva", "phone": "11999990000" }
      """
    Then the response status should be 200
    And the response should contain:
      | name  | João Silva    |
      | phone | 11999990000   |
      | email | joao@test.com |
      | role  | client        |
    And the response should not have a "password"
    When "joao" sends GET "/api/auth/me"
    Then the response should contain:
      | name | João Silva |

  Scenario: A user removes their phone
    Given a client "joao"
    When "joao" sends PATCH "/api/auth/me" with:
      """
      { "phone": "11999990000" }
      """
    And "joao" sends PATCH "/api/auth/me" with:
      """
      { "phone": null }
      """
    Then the response status should be 200
    And the response should not have a "phone"

  Scenario: A user changes their password
    Given a client "joao"
    When "joao" sends PATCH "/api/auth/me" with:
      """
      { "currentPassword": "secret123", "newPassword": "novaSenha456" }
      """
    Then the response status should be 200
    When an anonymous user sends POST "/api/auth/login" with:
      """
      { "email": "joao@test.com", "password": "novaSenha456" }
      """
    Then the response status should be 200
    When an anonymous user sends POST "/api/auth/login" with:
      """
      { "email": "joao@test.com", "password": "secret123" }
      """
    Then the response status should be 401

  Scenario: Changing the password with a wrong current password
    Given a client "joao"
    When "joao" sends PATCH "/api/auth/me" with:
      """
      { "currentPassword": "errada", "newPassword": "novaSenha456" }
      """
    Then the response status should be 400
    And the response message should be "Senha atual incorreta"

  Scenario: Changing the password without the current password
    Given a client "joao"
    When "joao" sends PATCH "/api/auth/me" with:
      """
      { "newPassword": "novaSenha456" }
      """
    Then the response status should be 400
    And the validation errors should include field "currentPassword"

  Scenario: A new password that is too short
    Given a client "joao"
    When "joao" sends PATCH "/api/auth/me" with:
      """
      { "currentPassword": "secret123", "newPassword": "123" }
      """
    Then the response status should be 400
    And the validation errors should include field "newPassword"

  Scenario: Updating the profile with an empty body
    Given a client "joao"
    When "joao" sends PATCH "/api/auth/me" with:
      """
      {}
      """
    Then the response status should be 400
    And the response message should be "Dados inválidos"

  Scenario Outline: E-mail and role cannot be changed through the profile
    Given a client "joao"
    When "joao" sends PATCH "/api/auth/me" with:
      """
      <body>
      """
    Then the response status should be 400
    And the response message should be "Dados inválidos"

    Examples:
      | body                          |
      | { "email": "novo@test.com" }  |
      | { "role": "admin" }           |

  Scenario: Updating the profile without a token
    When an anonymous user sends PATCH "/api/auth/me" with:
      """
      { "name": "Ninguém" }
      """
    Then the response status should be 401
