const { inquirer, database, separator, wait, displayTable} = require('./global')
const roles = require('./roles')
const options = [
    {name: '\x1b[94mView all of the Roles\x1b[0m', value: viewRoles },
    {name: '\x1b[94mAdd a Role\x1b[0m', value: addRole },
    separator,
    {name: '\x1b[94mUpdate the Name\x1b[0m', value: updateName },
    {name: '\x1b[94mRemove\x1b[0m', value: remove },
    separator,
    {name: 'Back', value: null }]
async function displayDepartmentTable(records) {
    const headers = ['name']
    const rows = records.map(department => {
        return {
            value: department,
            cells: [
                department.name
            ]
        }
    })
    const department = await displayTable(headers, rows)
    if (department)
    return await displayOptions(department)
    return null
}
async function displayOptions(department) {
    const {action} = await inquirer.prompt([{
        name: 'action',
        type: 'list',
        message: 'What action would you like to perform with this department?',
        prefix: '-',
        choices: options,
        pageSize: 99
    }])
    if (action) {
        await action(department)
    }
}
async function display() {
    const records = await database.getDepartments()
    await displayDepartmentTable(records)
}
async function add() {
    const departments = (await database.getDepartments()).map(record => record.name)
    const info = await inquirer.prompt([{
        name: 'name',
        message: 'Please provide the departments name.',
        prefix: '-',
        validate: input => {
            if (input.length == 0) return 'A Department name must be provided.'
            if (departments.includes(input)) return 'An existing Department has already taken the provided name.'
            return true
        }
    }])
    const id = await database.insertDepartment(info)
    console.log(id >= 0 ?
        `\x1b[32m ${info.name} was successfully added to departments.\x1b[0m` :
        `\x1b[31m Action failed... Department was not inserted.\x1b[0m`)
        const department = (await database.getDepartmentByID(id))[0]
        return await displayOptions(department)
}
async function updateName(department) {
    const departments = (await database.getDepartments()).map(record => record.name)
    console.log('- Okay, what would you like to change the name to?')
    const info = await inquirer.prompt([{
        name: 'name',
        message: 'Name |',
        prefix: ' ',
        default: department.name,
        validate: input => {
            if (input == department.name) return true
            if (input.length == 0) return 'A department name must be provided.'
            if (departments.includes(input)) return 'Oops that department already exists.'
            return true
        }
    }])
    const updated = await database.updateDepartment(department.id, info)
   const message = (() => {
       if (updated) {
           if (info.name == department.name)
           return `\x1b[32m Oops that name was not taken.\x1b[0m`
           if (info.name != department.name)
           return `\x1b[32m Name has changed to ${info.name}.\x1b[0m`
       } else
       return `\x1b[31m Oops name was not updated.\x1b[0m`
   })()
    console.log(message)
    return await displayOptions()
}
async function remove(department) {
    const departmentID = department.id
    const employeesInDepartment = await database.getDepartmentEmployees(departmentID)
    if (employeesInDepartment.length > 0) {
        console.log(' \x1b[33m Attention!: There are many employees still in this department. You are required\n' +
        ' to move the employees to another department first.\x1b[0m')
    } else {
        const removed = await database.deleteDepartment(departmentID)
        const message = removed ?
        '\x1b[32m The department no longer exists and has been removed.\x1b[0m' :
        '\x1b[31m The department was not removed.\x1b[0m'
        console.log(message)
    }
    await wait()
}
async function viewRoles(department) {
    await roles.display(department)
    await displayOptions(department)
}
async function addRole(department) {
    await roles.add(department)
    await displayOptions(department)
}
module.exports = { display, add}
