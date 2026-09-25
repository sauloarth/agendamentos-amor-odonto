Feature: Appointments
  Clients book procedures with professionals. A booking is only accepted
  when the slot is free of other appointments and schedule blocks.

  Background:
    Given an admin "admin"
    And a professional "ana"
    And a professional "bruno"
    And a client "joao"
    And a client "maria"
    And a product "Cleaning" lasting 30 minutes costing 150 performed by "ana"

  Rule: Booking

    Scenario: A client books a free slot
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:00}" }
        """
      Then the response status should be 201
      And the response should contain:
        | status            | scheduled                |
        | startDateTime     | {date:tomorrow at 10:00} |
        | endDateTime       | {date:tomorrow at 10:30} |
        | client._id        | {user:joao}              |
        | professional._id  | {user:ana}               |
        | product.name      | Cleaning                 |

    Scenario: Booking an inactive product
      Given the product "Cleaning" is inactive
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:00}" }
        """
      Then the response status should be 400
      And the response message should be "Produto indisponível para agendamento"

    Scenario: Booking an unknown product
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "000000000000000000000000", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:00}" }
        """
      Then the response status should be 404
      And the response message should be "Produto não encontrado"

    Scenario: Booking with a professional who does not perform the product
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:bruno}", "startDateTime": "{date:tomorrow at 10:00}" }
        """
      Then the response status should be 400
      And the response message should be "Profissional não realiza este produto"

    Scenario: Booking in the past
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:yesterday at 10:00}" }
        """
      Then the response status should be 400
      And the validation errors should include field "startDateTime"

    Scenario: Booking a slot that crosses midnight
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 23:45}" }
        """
      Then the response status should be 400
      And the response message should be "O horário do agendamento não pode ultrapassar a meia-noite"

    Scenario Outline: Only clients can book
      When "<user>" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:00}" }
        """
      Then the response status should be 403

      Examples:
        | user  |
        | ana   |
        | admin |

  Rule: A professional cannot be double-booked

    Background:
      Given "maria" has an appointment "A1" with "ana" for "Cleaning" at "tomorrow at 10:00"

    Scenario: Booking a slot that overlaps another appointment
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:15}" }
        """
      Then the response status should be 409
      And the response message should be "Horário indisponível para este profissional"

    Scenario: Booking right after another appointment
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:30}" }
        """
      Then the response status should be 201

    Scenario: A cancelled appointment frees the slot
      Given the appointment "A1" is cancelled
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:00}" }
        """
      Then the response status should be 201

  Rule: Blocks make slots unavailable

    Scenario: Booking during a single block of the professional
      Given a single block "ana-off" for "ana" from "tomorrow at 09:00" to "tomorrow at 12:00"
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:00}" }
        """
      Then the response status should be 409

    Scenario: Booking during a recurring block of the professional
      Given a recurring block "lunch" for "ana" on "monday" from "12:00" to "13:00"
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:next monday at 12:15}" }
        """
      Then the response status should be 409

    Scenario: A recurring block only applies to its weekdays
      Given a recurring block "lunch" for "ana" on "monday" from "12:00" to "13:00"
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:next tuesday at 12:15}" }
        """
      Then the response status should be 201

    Scenario: Booking during a clinic-wide block
      Given a single block "holiday" for the whole clinic from "tomorrow at 00:00" to "tomorrow at 23:59"
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:00}" }
        """
      Then the response status should be 409

    Scenario: Another professional's block does not affect the booking
      Given a single block "bruno-off" for "bruno" from "tomorrow at 09:00" to "tomorrow at 12:00"
      When "joao" sends POST "/api/appointments" with:
        """
        { "productId": "{product:Cleaning}", "professionalId": "{user:ana}", "startDateTime": "{date:tomorrow at 10:00}" }
        """
      Then the response status should be 201

  Rule: Each role sees only the appointments it is part of

    Background:
      Given a product "Whitening" lasting 60 minutes costing 400 performed by "bruno"
      And "joao" has an appointment "A1" with "ana" for "Cleaning" at "tomorrow at 10:00"
      And "maria" has an appointment "A2" with "bruno" for "Whitening" at "tomorrow at 11:00"

    Scenario: Clients only see their own appointments
      When "joao" sends GET "/api/appointments"
      Then the response status should be 200
      And the "_id" of the listed items should be:
        | {appointment:A1} |

    Scenario: Professionals only see their own schedule
      When "bruno" sends GET "/api/appointments"
      Then the response status should be 200
      And the "_id" of the listed items should be:
        | {appointment:A2} |

    Scenario: Admins see every appointment, most recent first
      When "admin" sends GET "/api/appointments"
      Then the response status should be 200
      And the "_id" of the listed items should be:
        | {appointment:A2} |
        | {appointment:A1} |

    Scenario: Admins filter appointments by status and professional
      Given the appointment "A2" is cancelled
      When "admin" sends GET "/api/appointments?status=cancelled"
      Then the "_id" of the listed items should be:
        | {appointment:A2} |
      When "admin" sends GET "/api/appointments?professional={user:ana}"
      Then the "_id" of the listed items should be:
        | {appointment:A1} |

    Scenario: A client cannot see someone else's appointment
      When "maria" sends GET "/api/appointments/{appointment:A1}"
      Then the response status should be 404
      And the response message should be "Agendamento não encontrado"

    Scenario: The professional sees the details of their appointment
      When "ana" sends GET "/api/appointments/{appointment:A1}"
      Then the response status should be 200
      And the response should contain:
        | client._id   | {user:joao} |
        | product.name | Cleaning    |

  Rule: Participants and admins can cancel

    Background:
      Given "joao" has an appointment "A1" with "ana" for "Cleaning" at "tomorrow at 10:00"

    Scenario Outline: Cancelling an appointment
      When "<user>" sends PATCH "/api/appointments/{appointment:A1}/cancel" with:
        """
        { "cancelReason": "Personal reasons" }
        """
      Then the response status should be 200
      And the response should contain:
        | status       | cancelled        |
        | cancelReason | Personal reasons |

      Examples:
        | user  |
        | joao  |
        | ana   |
        | admin |

    Scenario: Cancelling an appointment twice
      Given the appointment "A1" is cancelled
      When "joao" sends PATCH "/api/appointments/{appointment:A1}/cancel" with:
        """
        {}
        """
      Then the response status should be 400
      And the response message should be "Agendamento já está cancelado"

    Scenario: A third party cannot cancel an appointment
      When "maria" sends PATCH "/api/appointments/{appointment:A1}/cancel" with:
        """
        {}
        """
      Then the response status should be 404
