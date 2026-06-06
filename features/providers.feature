@providers
Feature: Provider Directory
  As an administrator
  I want to manage the provider directory
  So that patients can be assigned to the right clinicians

  Background:
    Given I am logged in as "admin"
    And I am on the "providers" page

  Scenario: The provider directory is visible
    Then the "providers" table should be visible

  Scenario: Open the new provider form
    When I click the "Add Provider" button
    Then I should see "Add Provider"
