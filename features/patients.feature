@patients
Feature: Patient Management
  As a scheduler
  I want to manage patient records
  So that demographics and care assignments stay accurate

  Background:
    Given I am logged in as "admin"
    And I am on the "patients" page

  Scenario: The patient directory is visible
    Then the "patients" table should be visible

  Scenario: Create a new patient
    When I click the "Add Patient" button
    And I fill in "First name" with "Jane"
    And I fill in "Last name" with "Doe"
    And I fill in "MRN" with "MRN-9001"
    And I submit the patient form
    Then I should see a success toast

  Scenario: Search for an existing patient
    When I search for "Smith"
    Then the "patients" table should be visible

  Scenario: Filter patients by status
    When I filter patients by status "active"
    Then the "patients" table should be visible

  @wip
  Scenario: Export the patient directory to CSV
    When I export the patient directory
    Then a CSV file should be downloaded
