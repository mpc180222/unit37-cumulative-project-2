const { BadRequestError } = require("../expressError");

//Receives JSON data to update a SQL record (dataToUpdate) as well as an object (jsToSql) where the key is the JS variable name, and the 
//value is the corresponding SQL column name. If there are no keys in dataToUpdate, a BadRequestError is thrown. The map function creates
//an array which will be the 2nd parameter passed to a db update query. It will use the the corresponding value from the jsToSql object,
//or if there isn't one, it will use the existing column name pulled from dataToUpdate. The function returns an object with two keys, one containing the columns, and one containing
//an array of the values we are updating with.

function sqlForPartialUpdate(dataToUpdate, jsToSql) {
  const keys = Object.keys(dataToUpdate);
  if (keys.length === 0) throw new BadRequestError("No data");

  // {firstName: 'Aliya', age: 32} => ['"first_name"=$1', '"age"=$2']
  const cols = keys.map((colName, idx) =>
      `"${jsToSql[colName] || colName}"=$${idx + 1}`,
  );

  return {
    setCols: cols.join(", "),
    values: Object.values(dataToUpdate),
  };
}

module.exports = { sqlForPartialUpdate };
