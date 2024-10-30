const mysql = require('mysql')
const db = mysql.createConnection({
host: "localhost",
user: "root",
password: "",
database:"mental_wealth" 
})

module.exports = db;

db.connect((err) =>{
    if(err){
        console.log(err);
    }
    else{
        console.log("Database succesfully connected");
    }
})