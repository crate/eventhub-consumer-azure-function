/**
 * 
 * This file contains an example azure function that consumes Azure Event Hub events 
 * and writes them to CrateDB defined by the CrateConnectionString environment variable
 * This file is supposed to be used as described in the README.rst file for it to work
 * as intended.
 * 
 * @summary example Azure Function to Connect Azure Event Hub with CrateDB
 * @author Joshua Hercher <josh@crate.io>
 * 
 * Created at       : 2020-02-20 20:20:20
 * Last modified    : -
 */

const { Client } = require('pg');

const CRATE_CONNECTION_STRING = process.env['CrateConnectionString'];
const TABLE = 'doc.raw_data';
const COLUMN_PAYLOAD = 'payload';

const crateClient = new Client({ connectionString: CRATE_CONNECTION_STRING });
crateClient.connect();

module.exports = async function (context, eventHubMessages) {

    // every message is stringified to enabled inserting each message as
    // single database entry
    let messages = [];
    eventHubMessages.forEach(element => {
        messages.push(`'${JSON.stringify(element)}'`);
    });

    // making a bulk insert using unnest: 
    // https://crate.io/docs/crate/reference/en/latest/general/builtins/table-functions.html?#unnest-array-array
    const stmt = `INSERT INTO ${TABLE} (${COLUMN_PAYLOAD}) ` +
        `(SELECT col1 FROM UNNEST ([${messages}]));`;

    await crateClient.query(stmt)
        .catch(error => {
            context.log("Insertion error", error);
        });
};
