const {inquirer, database, separator, wait, displayTable } = require('./global')
const employees = require('./employees')
const options = [
  {name: '\x1b[94mView all Employees\x1b[0m', value: viewEmployees },
  {name: '\x1b[92mAdd an Employee\x1b[0m', value: addEmployee },
  separator,
  {name: '\x1b[94mUpdate the Title\x1b[0m', value: updateTitle },
  {name: '\x1b[94mUpdate a Salary\x1b[0m', value: updateSalary },
  {name: '\x1b[94mRemove\x1b[0m', value: remove},
  separator,
  {name: 'Back', value: null}]

async function display(department) {
  const records = await database.getDepartmentRoles(department.id)
  if (records.length > 0 )
  await displayRoleTable(records)
  else {
    console.log(' \x1b[93mThere no roles exist for this department.\x1b[0m');
  }
}
async function displayRoleTable(records) {
  const headers = ['title', 'salary']
  const rows = records.map(role => {
    return {
      value: role,
      cells: [
        role.title,
        role.salary
      ]
    }
  })
  const role = await displayTable(headers, rows)
  if (role)
  return await displayOptions(role)
  return null
}
async function displayOptions(role) {
  const { action } = await inquirer.prompt([{
    name: 'action',
    type: 'list',
    message: 'What aciton would you like to perform with this role?',
    prefix: '-',
    choices: options,
    pageSize: 99
  }])
  if (action) {
    return await action(role)
  }
}
async function add(department) {
  const departmentID = department.id
  const roles = (await database.getAllTitles())
  .map(record => record.title)
  console.log('- Provide information for role:');
  const info = await inquirer.prompt([{
    name: 'title',
    message: 'Title |',
    prefix: ' ',
    validate: input => {
      if (input.length == 0) return 'A role title must be provided.'
      if (roles.includes(input)) return 'The role provided already exists in this department.'
      return true
    }
  }, {
    name: 'salary',
    message: 'Salary $$$ |',
    prefix: '',
    transformer: input => `$${(parseFloat(input)||0).toLocalString()}`,
    validate: input => parseFloat(input) >= 0 || 'The salary must be greater than $ (0).'}])
  info.salary = parseFloat(info.salary)
  info.department_id = departmentID
  const id = await database.insertRole(info)
  console.log(id >= 0 ? 
    `\x1b[32m ${info.title} was successfully added to roles.\x1b[0m` :
    `\x1b[31m Role was not inserted. \x1b[0m`)
    const role = (await database.getRoleByID(id))[0]
    return await displayOptions(role)
}
async function updateTitle(role) {
  const allTitles = (await database.getAllTitles()).map(role => role.title)
  console.log('- Ok, what would you like to changed the role title to?');
  const info = await inquirer.prompt([{
    name: 'title',
    message: 'Title  |',
    prefix: ' ',
    default: role.title,
    validate: input => {
      if (input == role.title) return true
      if (input.length == 0) return 'Role title must be provided try again.'
      if (allTitles.includes(input)) return 'That role already exists.'
      return true
    }
  }])
  const updated = await database.updateRole(role.id, info)
  const message = (() => {
    if (updated) {
      if (info.title == role.title)
      return `\x1b[33m The title was not changed successfully there is something wrong.\x1b[0m`
      if (info.title != role.title)
      return `\x1b[32m Great, the title has been successfully changed to ${info.title}.\x1b[0m`
    } else 
    return `\x1b[31m The title could not be updated at this time there is something wrong.\x1b[0m`
  })()
  console.log(message)
  return await displayOptions(role)
}
async function updateSalary(role) {
  console.log('- Salary of this role will need to be changed, type the change.');
  const info = await inquirer.prompt([{
    name: 'salary',
    message: 'Salary change  |',
    prefix: ' ',
    default: role.salary,
    transformer: input => `$${(parseFloat(input)||0).toLocalString()}`,
    validate: input => parseFloat(input) >= 0 || 'Number entered must be greater than or equal to (0).'
}])
  info.salary = parseFloat(info.salary)
  const updated = await database.updateRole(role.id, info)
  const message = (() => {
    if(updated) {
      if (info.salary == role.salary)
      return `\x1b[33m The salary was not changed.\x1b[0m`
      if (info.salary != role.salary)
      return `\x1b[32m The salary has been changed to $${info.salary.toLocalString()}.\x1b[0m]`
    } else 
    return `\x1b[32m The salary could not be updated.\x1b[0m`
  })()
  console.log(message)
  return await displayOptions(role)
}
async function remove(role) {
  const roleID = role.id
  const employeesInRole = await database.getRoleEmployees(roleID)
  if (employeesInRole.length > 0) {
    console.log(' \x1b[33m Oopsy, there seems to be a number of employees in this role still. You must\n' +
    ' move them to another role category.\x1b[0m')
  } else {
    const removed = await database.deleteRole(roleID) 
    const message = removed ?
    '\x1b[32m The role has been successfully removed.\x1b[0m' :
    '\x1b[31, Oops the role could not be removed at this time there was something wrong.\x1b[0m'
    console.log(message)
  }
  await wait()
}
async function viewEmployees(role) {
  const records = await database.getRoleEmployees(role.id)
  await employees.displayEmployeeTable(records)
  return await displayOptions(role)
}
async function addEmployee(role) {
  const employees = (await database.getDepartmentEmployees(role.department_id))
  .map(record => {
    const {id, full_name, title} = record
    return {
      name: `${full_name} - ${title}`,
      value: id
    }
  })
  console.log(employees);
  console.log('-Provide the name of the new employee here');
  const info = await inquirer.prompt([{
    name: 'first_name',
    message: 'First   |',
    prefix: ' ',
    validate: input => input.length > 1 || 'The employee\'s first name must be provided.'
  }, {
    name: 'last_name',
    message: 'Last   |',
    prefix: ' ',
    validate: input => input.length > 1 || 'The employee\'s last name must be provided.'
  }, {
    name: 'manager_id',
    type: 'list',
    message: 'Manager |',
    prefix: ' ',
    choices: [...employees, separator, {
      name: 'none',
      value: null
    }]
  }])
  info.role_id = role.id
  const id = await database.insertEmployee(info)
  console.log(id > 0 ?
    `\x1b[32m ${info.first_name + ' ' + info.last_name} was added to employees. \x1b[0m` :
    `\x1b[31m Could not insert employee.\x1b[0m`
    )
    return await displayOptions(role)
}
module.exports = { display, add }
