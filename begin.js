const {inquirer, database, separator} = require('./global')
const employees = require('./employees')
const departments = require('./departments')
// function to begin application
async function begin() {
    console.clear()
    displayHeader()
    const action = await promptInitialAction()
    if (action) {
        await action()
        await begin()
    } else {
        end()
    }
}
// first thing displayed print header function called in 
function displayHeader() {
    let header = []
    header.push("Employee Management application")
    console.log(header.join('\n'));
}
// displays an array of initial actions 
const initAction = [
    {name: '\x1b[94mView all Employees\x1b[0m', value: employees.display},
    {name: '\x1b[94mView the Employees by Department\x1b[0m', value: employees.displayByDepartment},
    {name: '\x1b[94mView some Employees by Manager\x1b[0m', value: employees.displayByManager},
    {name: '\x1b[92mAdd Employee here\x1b[0m', value: employees.add},
    // separator separates the actions
    separator,
    {name: '\x1b[94mView Departments here\x1b[0m', value: departments.display},
    {name: '\x1b[92mAdd a Department here\x1b[0m', value: departments.add},
    separator,
    {name: 'End', value: null}]
    // function for initial action
async function promptInitialAction() {
    const {action} = await inquirer.prompt([{
        name: 'action',
        type: 'list',
        message: 'What action would you like to perform?',
        prefix: '-',
        choices: initAction,
        pageSize: 99
    }])
    return action
}
// function and displays message when quit is selected
function end() {
    database.closeConnection()
    console.log('- Have a good one please!')
}
module.exports = begin