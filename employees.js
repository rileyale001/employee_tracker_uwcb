const { inquirer, database, separator, wait, displayTable} = require('./global')
async function displayEmployeeTable(records) {
    const headers = ['name', 'title', 'department', 'salary', 'manager']
    const rows = records.map(employee => {
        return {
            value: employee,
            cells: [
                employee.first_name + ' ' + employee.last_name,
                employee.title,
                employee.department,
                employee.salary,
                employee.manager,
            ]
        }
    })
    const employee = await displayTable(headers, rows)
    if (employee) await displayOptions(employee)
    return null
}
async function displayOptions(employee) {
    const {action} = await inquirer.prompt([{
        name: 'action',
        type: 'list',
        message: 'What action would you like to perform with this employee?',
        prefix: '-',
        choices: options,
        pageSize: 99
    }])
    if (action) {
        await action(employee)
        await displayOptions()
    }
}
async function display() {
    const records = await database.getEmployees()
    await displayEmployeeTable(records)
}
async function displayByDepartment() {
    const departments = (await database.getDepartments()).map(record => {
        return {
            name: record.name,
            value: record
        }
    })
    const {department} = await inquirer.prompt([{
        name: 'department',
        type: 'list',
        message: 'Which department would you like to view',
        prefix: '-',
        choices: departments
    }])
    const records = await database.getEmployees({department: department.name})
    await displayEmployeeTable(records)
}
async function displayByManager() {
    const managers = (await database.getManagers())
    .sort((a, b) => {
        if (a.full_name > b.full_name)
        return 1
        if (a.full_name < b.full_name)
        return -1
        return 0
    })
    .map(manager => {
        return {
            name: `${manager.full_name} - ${manager.title}`,
            value: manager
        }
    })
    const {manager} = await inquirer.prompt([{
        name: 'manager',
        type: 'list',
        message: 'Which manager would you like to see the employees of?',
        prefix: '-',
        choices: managers
    }])
    const records = await database.getEmployees({manager_id: manager.id})
    await displayEmployeeTable(records)
}
async function add() {
    const {first_name, last_name} = await inquirer.prompt([{
        name: 'first_name',
        message: 'First Name |',
        prefix: ' ',
         validate: input => input.length > 1 || ' The Employee\'s first name must be provided.'
    }, {
        name: 'last_name',
        message: 'Last Name |',
        prefix: ' ',
        validate: input => input.length > 1 || 'The employee\'s last name must be provided.'
    }])
    const departments = ( await database.getDepartments()).map(department => {
        return {
            value: department.id,
            name: department.name
        }
    })
    const {department_id} = await inquirer.prompt([{
        name: 'department_id',
        type: 'list',
        message: 'Department List  |',
        prefi: '  ',
        choices: departments
    }])
    const roles = (await database.getDepartmentRoles(department_id)).map(role => {
        return {
            value: role.id,
            name: role.title
        }
    })
    const employees = [...(await database.getDepartmentEmployees(department_id)).map(employee => {
        return {
            value: employee.id,
            name: `${employee.full_name} - ${employee.title}`
        }
    }), separator, {value: null, name: 'None'}]
    if (employees.length > 10) employees.push(separator)
    const {role_id, manager_id} = await inquirer.prompt([{
        name: 'role_id',
        type: 'list',
        message: 'Role List   |',
        choices: roles,
        pageSize: 10,
        prefix: ' '
    }, {
        name: 'manager_id',
        type: 'list',
        message: 'Manager List |',
        prefix: ' ',
        choices: employees,
        pageSize: 10
    }])
    const id = await database.insertEmployee({first_name, last_name, role_id, manager_id})
    const message = id > 0 ?
    `\x1b[32m ${first_name + ' ' + last_name} was successfully added as an employee.\x1b[0m` :
    '\x1b[31m Employee inserted invalid/not successful.\x1b[0m'
    console.log(message)
    const employee = (await database.getRoleByID(id))[0]
    return await displayOptions(employee)
}
const options = [
    {name: '\x1b[94mUpdate a Name\x1b[0m', value: updateName},
    {name: '\x1b[94mUpdate a Manager\x1b[0m', value: updateManager},
    {name: '\x1b[94mUpdate a Role\x1b[0m', value: updateRole},
    {name: '\x1b[94mUpdate a Department\x1b[0m', value: updateDepartment},
    {name: '\x1b[94mRemove a Employee\x1b[0m', value: remove},
    separator,
    {name: 'Back', value: null}]
async function updateName(employee) {
    const info = await inquirer.prompt([{
        name: 'first_name',
        message: 'Update First Name |',
        prefix: ' ',
        validate: input => input.length > 1 || 'Employee\'s first name must be provided.',
        default: employee.first_name
    }, {
        name: 'last_name',
        message: 'Update Last Name |', 
        prefix: ' ',
        validate: input => input.length > 1 || 'Employee\'s last name must be provided',
        default: employee.last_name
    }])
    const updated = await database.updateEmployee(employee.id, info)
     const message = (() => {
        if (updated) {
            if (employee.first_name != info.first_name && employee.last_name != info.last_name)
            return `\x1b[32m The name has been successfully changed to ${info.first_name + ' ' + info.last_name}.\x1b[0m`
            if (employee.first_name != info.first_name && employee.last_name == info.last_name)
            return `\x1b[32m The first name has been successfully changed to ${info.first_name}.\x1b[0m`
            if (employee.first_name == info.first_name && employee.last_name != info.last_name)
            return `\x1b[32m The Last name has been successfully changed to ${info.last_name}.\x1b[0m`
            if (employee.first_name == info.first_name && employee.last_name == info.last_name)
            return `\x1b[33m The name was not successfully changed.\x1b[0m`
        } else {
            return `\x1b[31m Name could not be updated. \x1b[0m`
        } 
    })()
    console.log(message);
    return await displayOptions(employee)
}
async function getManager(department_id, except) {
    const employees = [...(await database.getDepartmentEmployees(department_id, except)).map(employee => {
        return {
            value: employee,
            name: `${employee.first_name} - ${employee.title}`
        }
    }), separator, {name: 'None', value: {id: null, full_name: null, title: null}}]
    if (employees.length > 10) employees.push(separator)
    const {manager} = await inquirer.prompt([{
        name: 'manager',
        type: 'list',
        message: 'Manager List |',
        prefix: ' ',
        choices: employees,
        pageSizez: 10
    }])
    return manager
}
async function updateManager(employee) {
    const manager = await getManager(employee.department_id, employee.id)
    const updated = await database.updateEmployee(employee.id, {manager_id: manager ? manager.id : null})
    const message = (() => {
        if (updated) {
            if (employee.manager != manager.full_name) {
                return manager.full_name != null ?
                `\x1b[32m The manager was successfully changed to ${manager.full_name}.\x1b[0m` :
                `\x1b[32m The employee no longer has a manager please assign another manager to the employee '.\x1b[0m`
            } else {
                return `\x1b[32m The manager was not successfully changed.\x1b[0m`
            }
        } else {
            return `\x1b[31m The manager could not be updated at this time please try again.\x1b[0m`
        }
    })()
    console.log(message);
    return await displayOptions(employee)
}
async function getRole(department_id) {
    const roles = (await database.getDepartmentRoles(department_id)).map(role => {
        return {
            value: role,
            name: role.title,
        }
    })
    const {role} = await inquirer.prompt([{
        name: 'role',
        type: 'list',
        message: 'Role List |',
        prefix: ' ',
        choices: roles,
        pageSize: 10
    }])
    return role
}
async function updateRole(employee) {
    const department_id = employee.department_id
    const employee_id = employee.id
    const role = await getRole(department_id)
    const manager = await getManager(department_id, employee_id)
    const updated = await database.updateEmployee(employee_id, {
    role_id: role.id,
    manager_id: manager.id

    })
    const message = (() => {
        if (updated) {
                if (employee.title == role.title && employee.manager == manager.full_name)
                return `\x1b[33m The role and manager were not successfully changed.\x1b[0m`
                if (employee.title != role.title && employee.manager == manager.full_name)
                return `\x1b[32m The role was successfully changed to ${role.title}.\x1b[0m`
                const updatedManager = () => {
                    return manager.full_name != null ?
                    `the manager is now ${manager.full_name}` :
                    `The employee no longer has a manager please assign the employee a manager.`
                }
                if (employee.title == role.title && employee.manager != manager.full_name)
                return `\x1b[32m The role was not successfully changed, but ${updatedManager()}.\x1b[0m`
                if (employee.title != role.title && employee.manager != manager.full_name)
                return `\x1b[32m The role was successfully changed to ${role.title} and ${updatedManager()}.\x1b[0m`
        } else {
            return `\x1b[31m The manager could not be updated successfully please try again.\x1b[0m`
        }
    })()
    console.log(message);
    return await displayOptions(employee)
}
async function getDepartment() {
    const departments = (await database.getDepartments()).map(department => {
        return {
            name: department.name,
            value: department
        }
    })
    const {department} = await inquirer.prompt([{
        name: 'department',
        type: 'list',
        message: 'Department List |',
        prefix: ' ',
        choicese: departments
    }])
    return department
}
async function updateDepartment(employee) {
    const department = await getDepartment()
    const department_id = department.id
    const employee_id = employee.id
    const role = await getRole(department_id)
    const manager = await getManager(department_id, employee_id)
    const updated = await database.updateEmployee(employee_id, {
    role_id: role.id,
    manager_id: manager.id
    })
    const message = (() => {
        if (updated) {
            if (employee.department == department.name) {
                if (employee.title == role.title && employee.manager == manager.full_name)
                return `\x1b[33m Nothing was changed.\x1b[0m`
                if (employee.title != role.title && employee.manager == manager.full_name)
                return `\x1b[32m This department wasn't changed, but the role was successfully changed to ${role.title}.\x1b[0m`
                const updatedManager = () => {
                    return manager.full_name != null ?
                    `the manager assigned is now ${manager.full_name}` :
                    `This employee does not hava a manager anymore`
                }
                if (employee.title == role.title && employee.manager != manager.full_name)
                return `\x1b[32m Department and role were not changed, but ${updatedManager()}.\x1b[0m`
                if (employee.title != role.title && employee.managrer != manager.full_name)
                return `\x1b[32m THe department wasn't changed, but the role is now ${role.title} and ${updatedManager()}.\x1b[0m`
            } else {
                return `\x1b[32 Department was successfully changed to ${department.name} with the role of ${role.title} with ${manager.full_name ?
                    `${manager.full_name} as the manager` :
                    `no manager`}.\x1b[0m`
            }
        } else {
            return `\x1b[31m The manager could not be updated.\x1b[0m`
        }
    })()
    console.log(message);
    return await displayOptions(employee)
}
async function remove(employee) {
    const removed = await database.deleteEmployee(employee.id)
    console.log(removed ?
        `\x1b[32m ${employee.first_name + ' ' + employee.last_name} was removed.\x1b[0m` :
        `\x1b[31m The employee could not be removed.\x1b[0m`)
        await wait()
        return removed
}
module.exports = {
    display,
    displayByDepartment,
    displayByManager,
    displayEmployeeTable,
    add
}
