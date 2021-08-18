require('console.table')
const inquirer = require('inquirer')
const database = require('./database')
const separator = new inquirer.Separator()
async function wait() {
    await inquirer.prompt([{
        name: 'wait',
        type: 'input',
        message: '\x1b[90m-- Press the enter key to continue. --\x1b[0m',
        prefix: ' ',
        transformer: () => ""
    }])
}
// function to display table in global
async function displayTable(headers, rows) {
    if (rows && rows.length) {
        const widths = headers.map(header => header.length)
        for (const row of rows) {
            const cells = row.cells
            for (const i in cells) {
                const cell = cells[i] = (cells[i] == null ? '' : cells[i])
                const width = widths[i]
                const len = cell.length
                if (len > width) widths[i] = len
            }
        }
        for (const row of rows) {
            row.name = row.cells.map((cell, i) => {
                return isNaN(cell) ? cell.padEnd(widths[i]) : `${cell}`.padStart(widths[i])
            }).join(' ')
        }
        const dRowsD = [...rows, separator, {name:'Back', value: null}]
        if (dRowsD.length > 10) dRowsD.push(separator)
        const hRowH = headers.map((header, i) => header.replace('_', ' ').toUpperCase().padEnd(widths[i])).join(' ')
        const SrowS = headers.map((header, i) => '-'.repeat(widths[i])).join(' ')
        const {record} = await inquirer.prompt([{
            name: 'record',
            type: 'list',
            message: hRowH + '\n ' + SrowS + '\n ',
            prefix: '-',
            choices: dRowsD,
            pageSize: 10,
        }])
        return record
    }
    return null
}
module.exports = {
    inquirer,
    database,
    separator,
    wait,
    displayTable
}