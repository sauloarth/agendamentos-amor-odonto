Feature: Products
  Products are the procedures offered by the clinic. Anyone can browse
  active products; only admins can create, change or deactivate them.

  Background:
    Given an admin "admin"
    And a professional "ana"
    And a professional "bruno"
    And a client "joao"
    And a product "Cleaning" lasting 30 minutes costing 150 performed by "ana"
    And a product "Whitening" lasting 60 minutes costing 400 performed by "bruno"
    And a product "Extraction" lasting 45 minutes costing 300 performed by "ana"
    And the product "Extraction" is inactive

  Scenario: Visitors only see active products, sorted by name
    When an anonymous user sends GET "/api/products"
    Then the response status should be 200
    And the "name" of the listed items should be:
      | Cleaning  |
      | Whitening |

  Scenario: Admins also see inactive products
    When "admin" sends GET "/api/products"
    Then the response status should be 200
    And the "name" of the listed items should be:
      | Cleaning   |
      | Extraction |
      | Whitening  |

  Scenario: Filtering products by professional
    When an anonymous user sends GET "/api/products?professional={user:ana}"
    Then the response status should be 200
    And the "name" of the listed items should be:
      | Cleaning |

  Scenario: Product details include the linked professionals
    When an anonymous user sends GET "/api/products/{product:Cleaning}"
    Then the response status should be 200
    And the response should contain:
      | name                   | Cleaning   |
      | durationMinutes        | 30         |
      | price                  | 150        |
      | professionals.0._id    | {user:ana} |
      | professionals.0.name   | ana        |
    And the response should not have a "professionals.0.password"

  Scenario: An inactive product is hidden from non-admins
    When "joao" sends GET "/api/products/{product:Extraction}"
    Then the response status should be 404
    And the response message should be "Produto não encontrado"

  Scenario: Admins can see an inactive product
    When "admin" sends GET "/api/products/{product:Extraction}"
    Then the response status should be 200
    And the response should contain:
      | active | false |

  Scenario: An admin creates a product
    When "admin" sends POST "/api/products" with:
      """
      { "name": "Implant", "durationMinutes": 90, "price": 2500, "professionals": ["{user:bruno}"] }
      """
    Then the response status should be 201
    And the response should contain:
      | name                | Implant      |
      | active              | true         |
      | professionals.0._id | {user:bruno} |

  Scenario: Only professionals can be linked to a product
    When "admin" sends POST "/api/products" with:
      """
      { "name": "Implant", "durationMinutes": 90, "price": 2500, "professionals": ["{user:joao}"] }
      """
    Then the response status should be 400
    And the response message should be "Um ou mais profissionais informados são inválidos"

  Scenario: Creating a product with invalid data
    When "admin" sends POST "/api/products" with:
      """
      { "name": "Implant", "durationMinutes": 0, "price": -10 }
      """
    Then the response status should be 400
    And the validation errors should include field "durationMinutes"
    And the validation errors should include field "price"

  Scenario: An admin deactivates a product
    When "admin" sends PATCH "/api/products/{product:Cleaning}" with:
      """
      { "active": false }
      """
    Then the response status should be 200
    And the response should contain:
      | active | false |

  Scenario: An admin replaces the professionals of a product
    When "admin" sends PATCH "/api/products/{product:Cleaning}" with:
      """
      { "professionals": ["{user:bruno}"] }
      """
    Then the response status should be 200
    And the response field "professionals" should have 1 item
    And the response should contain:
      | professionals.0._id | {user:bruno} |

  Scenario Outline: Non-admins cannot manage products
    When "<user>" sends POST "/api/products" with:
      """
      { "name": "Implant", "durationMinutes": 90, "price": 2500 }
      """
    Then the response status should be 403
    And the response message should be "Acesso negado para esse papel de usuário"

    Examples:
      | user |
      | joao |
      | ana  |

  Scenario: Visitors cannot manage products
    When an anonymous user sends PATCH "/api/products/{product:Cleaning}" with:
      """
      { "active": false }
      """
    Then the response status should be 401
