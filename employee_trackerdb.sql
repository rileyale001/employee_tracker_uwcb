DROP DATABASE IF EXISTS employee_trackerdb;
CREATE database employee_trackerdb;
USE employee_trackerdb;
###################
## CREATE TABLES ##
###################
CREATE TABLE department (
  id INT AUTO_INCREMENT,
  name VARCHAR(30),
  PRIMARY KEY (id)
);
CREATE TABLE role (
  id INT AUTO_INCREMENT,
  title VARCHAR(30),
  salary DECIMAL,
  department_id INT,
  PRIMARY KEY (id),
  FOREIGN KEY (department_id) REFERENCES department(id)
);
CREATE TABLE employee (
  id INT AUTO_INCREMENT,
  first_name VARCHAR(30),
  last_name VARCHAR(30),
  role_id INT,
  manager_id  INT,
  PRIMARY KEY (id),
  FOREIGN KEY (role_id) REFERENCES role(id),
  FOREIGN KEY (manager_id) REFERENCES employee(id)
);
#################
## INSERT ROWS ##
#################
INSERT INTO department (name) VALUES
('Sales'),
('Engineering'),
('Finance'),
('Legal');
INSERT INTO role  (title, salary, department_id) VALUES
('Sales Lead', 110000, 1),
('Sales rep', 90000, 1),
('Lead Engineer', 180000, 2),
('Software Engineer', 130000, 2),
('Account Manager', 150000, 3),
('Accountant', 115000, 3),
('Legal Team Lead', 250000, 4),
('Lawyer', 200000, 4);
INSERT INTO employee (first_name, last_name, manager_id, role_id) VALUES
('Sharon', 'Buschard', null, 1),
('Joseph', 'Taylor', 1, 2),
('Caspiet', 'Tongo', 1, 2),
('Samantha', 'Singh', 1, 2),
('Tony', 'Billups', 1, 2),
('Michael', 'Brown', null, 3),
('Gabriel', 'Hernandez', null, 3),
('Josh', 'Thomas', 6, 4),
('Sal', 'Green', 6, 4),
('Taylor', 'Salazar', 6, 4),
('Sasha', 'Salinga', 7, 4),
('Robert', 'Ory', 7, 4),
('Samm', 'Acosta', 7, 4),
('Xiou', 'Wu', null, 5),
('Taylor', 'Smith', null, 5),
('Jamaal', 'Friday', 14, 6),
('Frederick', 'Wilkons', 14, 6),
('Enrique', 'Jorges', 14, 6),
('Castro', 'Toves', 15, 6),
('Benjamin', 'Bustamonte', 15, 6),
('Lorenzo', 'Jaime', null, 7),
('Stephen', 'Xiu', null, 7),
('Crystal', 'Yang', 21, 8),
('Paul', 'Green', 21, 8),
('Paul', 'White', 22, 8),
('Tracy', 'Moore', 22, 8);
##################
## CREATE VIEWS ##
##################
CREATE VIEW employee_view AS
SELECT
e.id,
e.first_name,
e.last_name,
e.manager_id,
CONCAT(m.first_name, " ", m.last_name) AS manager,
e.role_id,
r.title,
r.salary,
r.department_id,
d.name AS department
FROM employee e 
LEFT JOIN employee m ON e.manager_id = m.id
LEFT JOIN role r ON e.role_id = r.id 
LEFT JOIN department d ON r.department_id = d.id;
SELECT * FROM employee_view;
CREATE VIEW manager_view AS 
SELECT *
FROM employee_view
WHERE id IN (
  SELECT manager_id
  FROM employee
  WHERE manager_id IS NOT NULL
  GROUP BY manager_id
);
