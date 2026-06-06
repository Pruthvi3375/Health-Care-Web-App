@auth @smoke
Feature: Authentication
  As a clinic staff member
  I want to sign in to HealthCore EMS
  So that I can access patient information securely

  Scenario: Admin signs in with valid credentials
    Given I am on the login page
    When I log in as "admin"
    Then I should be on the dashboard
    And I should see "Dashboard"

  Scenario: Sign in fails with invalid credentials
    Given I am on the login page
    When I sign in with email "nobody@healthcore.demo" and password "wrongpass"
    Then I should see an authentication error

  @wip
  Scenario: Locked accounts are rejected after repeated failures
    Given I am on the login page
    When I attempt to sign in five times with the wrong password
    Then my account should be temporarily locked
