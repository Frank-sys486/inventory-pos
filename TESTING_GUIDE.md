# FinOpenPOS - Quality Assurance and Testing Guide

## 1. Introduction

This document provides a step-by-step guide for testing the FinOpenPOS application to ensure it is ready for a production environment. The tests are designed to be executed by a quality assurance tester and cover all the core features of the system.

## 2. Prerequisites

-   **Login Credentials:** You will need a valid username and password to access the admin panel.
-   **Access:** You should have access to the running application.

## 3. Testing Environment

-   **Application URL:** [http://localhost:3000](http://localhost:3000) (or the production URL once deployed)

## 4. Testing Scenarios

Please follow the steps for each test case and record the actual results.

---

### 4.1. Authentication

| Test Case ID | Feature        | Test Objective               |
| :----------- | :------------- | :--------------------------- |
| **TC-001**   | Authentication | Verify successful user login |

**Test Steps:**

1.  Navigate to the login page.
2.  Enter your valid username and password.
3.  Click the "Login" button.

**Expected Result:**

-   You should be redirected to the admin dashboard.
-   You should see a welcome message or the main dashboard interface.

**Actual Result:** _________________________

**Status:** (Pass/Fail)

---

### 4.2. Product Management

| Test Case ID | Feature    | Test Objective                  |
| :----------- | :--------- | :------------------------------ |
| **TC-002**   | Products   | Verify creation of a new product|

**Test Steps:**

1.  Log in to the application.
2.  Navigate to the "Products" page from the admin sidebar.
3.  Click the "Add Product" button.
4.  Fill in all the required fields: Name, Cost, Price, and Unit.
5.  Fill in the optional fields if you wish: Description, In Stock, Category.
6.  Click the "Add Product" button in the dialog.

**Expected Result:**

-   The new product should appear in the product list without needing to refresh the page.
-   The data in the table for the new product should match what you entered.
-   You should be able to find the new product in your MongoDB database under the `products` collection.

**Actual Result:** _________________________

**Status:** (Pass/Fail)

| Test Case ID | Feature    | Test Objective                    |
| :----------- | :--------- | :-------------------------------- |
| **TC-003**   | Products   | Verify editing an existing product|

**Test Steps:**

1.  On the "Products" page, locate the product you created in **TC-002**.
2.  Click the "Edit" icon (pencil) for that product.
3.  Change the "Name" and "Price" of the product.
4.  Click the "Update Product" button.

**Expected Result:**

-   The product's information in the table should be updated immediately.
-   The new name and price should be reflected.

**Actual Result:** _________________________

**Status:** (Pass/Fail)

| Test Case ID | Feature    | Test Objective                     |
| :----------- | :--------- | :--------------------------------- |
| **TC-004**   | Products   | Verify deleting an existing product|

**Test Steps:**

1.  On the "Products" page, locate the product you edited in **TC-003**.
2.  Click the "Delete" icon (trash can) for that product.
3.  A confirmation dialog should appear. Click the "Delete" button.

**Expected Result:**

-   The product should be removed from the product list immediately.
-   The product should be removed from your MongoDB database.

**Actual Result:** _________________________

**Status:** (Pass/Fail)

---

### 4.3. Customer Management

| Test Case ID | Feature     | Test Objective                   |
| :----------- | :---------- | :------------------------------- |
| **TC-005**   | Customers   | Verify creation of a new customer|

**Test Steps:**

1.  Navigate to the "Customers" page from the admin sidebar.
2.  Click the "Add Customer" button.
3.  Fill in the "Name" field.
4.  Fill in the optional fields if you wish: Email, Phone, Status.
5.  Click the "Create Customer" button.

**Expected Result:**

-   The new customer should appear in the customer list without needing to refresh the page.
-   The data in the table for the new customer should match what you entered.

**Actual Result:** _________________________

**Status:** (Pass/Fail)

| Test Case ID | Feature     | Test Objective                     |
| :----------- | :---------- | :--------------------------------- |
| **TC-006**   | Customers   | Verify deleting an existing customer|

**Test Steps:**

1.  On the "Customers" page, locate the customer you created in **TC-005**.
2.  Click the "Delete" icon (trash can) for that customer.
3.  A confirmation dialog should appear. Click the "Delete" button.

**Expected Result:**

-   The customer should be removed from the customer list immediately.

**Actual Result:** _________________________

**Status:** (Pass/Fail)

---

### 4.4. Order Management

| Test Case ID | Feature   | Test Objective                           |
| :----------- | :-------- | :--------------------------------------- |
| **TC-007**   | Orders    | Verify creation of a new order           |

**Test Steps:**

1.  First, ensure you have at least one product and one customer created (from previous tests).
2.  Navigate to the "Orders" page from the admin sidebar.
3.  Click the "Create Order" button.
4.  In the dialog, select a customer from the "Customer" dropdown.
5.  Use the "Add a product" search box to find and add at least two different products.
6.  For each product added, adjust the quantity.
7.  Observe the "Total" amount to ensure it calculates correctly.
8.  Select a "Status" for the order.
9.  Click the "Create Order" button.

**Expected Result:**

-   The new order should appear at the top of the order list immediately.
-   The customer name, total amount, and status should be correct in the table.
-   The `in_stock` quantity for the products you added to the order should be reduced in the database.

**Actual Result:** _________________________

**Status:** (Pass/Fail)
