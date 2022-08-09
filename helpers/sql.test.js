const { sqlForPartialUpdate } = require("./sql");
const { BadRequestError } = require("../expressError");


describe("sqlForPartialUpdate", function () {
    test("correctly takes js object and outputs sql-ready data", function () {
      const data = {firstName: 'Aliya', age: 32, lastName: 'Smith', favoriteSport: 'Polo'};
      const js = {firstName: "first_name", lastName: "last_name", favoriteSport: "favorite_sport"};
      let result = sqlForPartialUpdate(data, js);

      expect(result).toEqual({
        setCols: '"first_name"=$1, "age"=$2, "last_name"=$3, "favorite_sport"=$4',
        values : ['Aliya', 32, 'Smith', 'Polo']
      });
  
    });

  
    test('throws error if no data given', () => {
      const data = {};
      const js = {firstName: "first_name", lastName: "last_name", favoriteSport: "favorite_sport"};
      expect(() => {
        sqlForPartialUpdate(data, js);
      }).toThrow(new BadRequestError("No data"))});

      test('Uses default column names if 2nd parameter is empty', () => {
        const data = {name: 'Aliya', age: 32, occupation: 'carpenter', pets: 3};
        const js = {};
        let result = sqlForPartialUpdate(data, js);
  
        expect(result).toEqual({
          setCols: '"name"=$1, "age"=$2, "occupation"=$3, "pets"=$4',
          values : ['Aliya', 32, 'carpenter', 3]
        });
    
      });

      
      

    });



