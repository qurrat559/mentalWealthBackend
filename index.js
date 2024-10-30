const express = require("express");
const db = require("./src/database/database_config");
const cors = require("cors");
// const bcrypt = require('bcryptjs');;
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 3002;
app.use(cors());
app.use(express.json());

// Signup route
app.post("/signup", async (req, res) => {
  const {
    name,
    phoneNumber,
    password,
    cnicNumber,
    petName,
    userType,
  } = req.body;

  // Check if user with the provided phone number or CNIC number already exists
  const checkUserQuery =
    "SELECT COUNT(*) as count FROM users WHERE phoneno = ? OR cnic = ?";

  db.query(
    checkUserQuery,
    [phoneNumber, cnicNumber],
    async (error, results) => {
      if (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
      } else {
        if (results[0].count > 0) {
          return res.status(400).json({ message: "User already exists" });
        } else {
          console.log("Pass: ", password);

          // // Hash the password
          // const hashedPassword = await bcrypt.hash(password, 10);

          // console.log('Encrypted Pass: ', hashedPassword);

          // Insert user into the database
          const insertUserQuery =
            "INSERT INTO users(name, cnic, phoneno, password, role, secretques) VALUES (?, ?, ?, ?, ?, ?)";

          db.query(
            insertUserQuery,
            [name, cnicNumber, phoneNumber, password, userType, petName],
            (error) => {
              if (error) {
                console.error(error);
                return res
                  .status(500)
                  .json({ message: "Internal server error" });
              } else {
                return res
                  .status(200)
                  .json({ message: "User created successfully" });
              }
            }
          );
        }
      }
    }
  );
});

// Define the API endpoint to get the emergency contact
app.get("/api/emergency/:id", (req, res) => {
  let { id } = req.params
  const query = `SELECT emergency_contact FROM users WHERE id = ${id}`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching emergency contact:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
    
    if (result.length > 0) {
      res.json({ emergencyContact: result[0].emergency_contact });
    } else {
      res.status(404).json({ message: "Emergency contact not found" });
    }
  });
});

// app.post('/login', async (req, res) => {
//     const { cnic, password } = req.body;

//     try {
//         const findUserQuery = 'SELECT * FROM users WHERE cnic = ?';
//         const results = await db.query(findUserQuery, [cnic]);

//         console.log('query result',results);

//         if (results.length > 0) {
//             const user = results[0];

//             // const isMatch = await bcrypt.compare(password, user.password);
//             db.query('SELECT * FROM users WHERE cnic =? AND password =?', [cnic, password],
//             (err, result) =>{
//                 if(err){
//                 console.log(err);
//                 }
//                 else{
//                     if(result.length>0){
//                         console.log("Login successful");
//                     }
//                     else{
//                         console.log("Invalid Credidentials");
//                     }
//                 }

//             }
//         )
//             // if () {
//             //     return res.status(200).json({ success: true });
//             // } else {
//             //     return res.status(401).json({ success: false, message: 'Invalid credentials' });
//             // }
//         } else {
//             return res.status(404).json({ success: false, message: 'User not found' });
//         }
//     } catch (error) {
//         console.error('Error during login:', error);
//         return res.status(500).json({ success: false, message: 'Internal server error' });
//     }
// });

//Login Api
app.post("/login", (req, res) => {
  try {
    const { cnic, password, role } = req.body;

    // Query to check the cnic, password, and role
    const loginQuery =
      "SELECT id, name, cnic, phoneno, role FROM users WHERE cnic = ? AND password = ? AND role = ?";

    db.query(loginQuery, [cnic, password, role], (err, result) => {
      if (err) {
        console.error("Database error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Internal server error" });
      } else {
        if (result.length > 0) {
          // If user is found, send user details in the response
          const user = result[0];
          return res.status(200).json({
            success: true,
            message: "Login successful",
            userDetails: {
              id: user.id,
              name: user.name,
              cnic: user.cnic,
              phoneNumber: user.phoneno,
              role: user.role,
            },
          });
        } else {
          return res
            .status(401)
            .json({ success: false, message: "Invalid credentials" });
        }
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// API endpoint for mental health assessment
app.post("/mental-health-assessment", (req, res) => {
  const answers = req.body.answers;
  const totalScore = calculateTotalScore(answers);
  const riskLevel = determineRiskLevel(totalScore);

  res.json({ riskLevel });
});

// Calculate total score based on answers
const calculateTotalScore = (answers) => {
  // Define your scoring logic here
  let totalScore = 0;
  for (const answer of answers) {
    if (answer === "Yes") {
      totalScore += 1;
    }
  }
  return totalScore;
};

// Determine risk level based on total score
const determineRiskLevel = (totalScore) => {
  if (totalScore < 10) {
    return "Low";
  } else if (totalScore >= 10 && totalScore <= 20) {
    return "Medium";
  } else if (totalScore >= 21 && totalScore <= 30) {
    return "High";
  } else {
    return "Severe";
  }
};

//Submit Individual's Feedback
app.post("/submit-feedback", (req, res) => {
  const { question1, question2, question3 } = req.body;

  const sql =
    "INSERT INTO feedback ( question1, question2, question3) VALUES (?, ?, ?)";
  const values = [question1, question2, question3];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting feedback:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to submit feedback" });
    }
    res
      .status(200)
      .json({ success: true, message: "Feedback submitted successfully" });
  });
});

//Submit consultant's Feedback
app.post("/submit-consultant-feedback", (req, res) => {
  const { question1, question2, question3 } = req.body;

  const sql =
    "INSERT INTO consultantfeedback ( question1, question2, question3) VALUES (?, ?, ?)";
  const values = [question1, question2, question3];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting feedback:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to submit feedback" });
    }
    res
      .status(200)
      .json({ success: true, message: "Feedback submitted successfully" });
  });
});

//forgot password
app.post("/forgot-password", async (req, res) => {
  const { cnic, petName, newPassword } = req.body;

  // Fetch the user with the provided CNIC and secret question answer (petName)
  const getUserQuery =
    "SELECT COUNT(*) as count FROM users WHERE cnic = ? AND secretques = ?";

  db.query(getUserQuery, [cnic, petName], async (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error" });
    } else {
      if (results[0].count === 0) {
        return res
          .status(400)
          .json({ message: "Incorrect secret answer or CNIC." });
      } else {
        // Update the user's password
        const updatePasswordQuery =
          "UPDATE users SET password = ? WHERE cnic = ?";

        db.query(updatePasswordQuery, [newPassword, cnic], (error) => {
          if (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
          } else {
            return res
              .status(200)
              .json({ message: "Password updated successfully" });
          }
        });
      }
    }
  });
});

//consultant detail form
app.post("/consultant-detail", (req, res) => {
  const {
    name,
    specialization,
    availableDays,
    clinicTiming,
    address,
    consultationFee,
    notes = "", // Default to empty string if not provided
  } = req.body;

  const checkSql = `
    SELECT * FROM ConsultantDetails 
    WHERE available_days = ? AND clinic_timing = ?
  `;
  const checkValues = [availableDays.value, clinicTiming.value];

  db.query(checkSql, checkValues, (checkErr, checkResult) => {
    if (checkErr) {
      console.error("Error checking existing record:", checkErr);
      return res
        .status(500)
        .json({ success: false, message: "Database query error" });
    }

    if (checkResult.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This slot is already part of your schedule. Please select a different day or time.",
      });
    }

    const insertSql = `
      INSERT INTO ConsultantDetails 
      (name, specialization, available_days, clinic_timing, address, consultation_fee, notes) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const insertValues = [
      name,
      specialization,
      availableDays.value,
      clinicTiming.value,
      address,
      consultationFee,
      notes,
    ];

    db.query(insertSql, insertValues, (insertErr, result) => {
      if (insertErr) {
        console.error("Error inserting consultant details:", insertErr);
        return res
          .status(500)
          .json({ success: false, message: "Failed to save consultant details" });
      }

      res.status(201).json({
        success: true,
        message: "Consultant details saved successfully",
        insertId: result.insertId,
      });
    });
  });
});

app.get("/individual/get-consultant", (req, res) => {
  const query = "SELECT * FROM consultantdetails";

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching consultant details:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length > 0) {
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ message: "Consultant details not found." });
    }
  });
});

app.post("/individual/book-appointment", (req, res) => {
  const { individual_id, consultant_id } = req.body;

  const checkSql = `
    SELECT * FROM appointments 
    WHERE individual_id = ? AND consultation_id = ?
  `;
  const checkValues = [individual_id, consultant_id];

  db.query(checkSql, checkValues, (checkErr, results) => {
    if (checkErr) {
      console.error("Error checking for existing appointment:", checkErr);
      return res.status(500).json({
        success: false,
        message: "An error occurred while checking appointment",
      });
    }

    if (results.length > 0) {
      return res.status(409).json({
        success: false,
        message: "You have already booked this appointment.",
      });
    }

    const insertSql = `
      INSERT INTO appointments (individual_id, consultation_id) 
      VALUES (?, ?)
    `;
    const insertValues = [individual_id, consultant_id];

    db.query(insertSql, insertValues, (insertErr, result) => {
      if (insertErr) {
        console.error("Error inserting appointment data:", insertErr);
        return res.status(500).json({
          success: false,
          message: "Failed to book appointment",
        });
      }

      res.status(201).json({
        success: true,
        message: "Appointment booked successfully",
        insertId: result.insertId,
      });
    });
  });
});

app.get("/consultant/get-patients", (req, res) => {
  const query = `SELECT 
    appointments.id AS appointment_id,
    users.name AS individual_name,
    users.cnic AS individual_cnic,
    consultantdetails.name AS consultant_name,
    consultantdetails.specialization AS consultant_specialization,
    consultantdetails.clinic_timing as appointment_timing,
    consultantdetails.available_days as appointment_day
FROM 
    appointments
JOIN 
    users ON appointments.individual_id = users.id
JOIN 
    consultantdetails ON appointments.consultation_id = consultantdetails.id;
`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching appointment details:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length > 0) {
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ message: "Patients details not found." });
    }
  });
});

app.get("/admin/consultant-feedback", (req, res) => {
  const query = `SELECT * FROM consultantfeedback`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching consultant feedback:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length > 0) {
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ message: "Consultant feedback not found." });
    }
  });
});

app.get("/admin/individual-feedback", (req, res) => {
  const query = `SELECT * FROM feedback`;

  db.query(query, (err, result) => {
    if (err) {
      console.error("Error fetching consultant feedback:", err);
      return res.status(500).json({ message: "Internal server error" });
    }

    if (result.length > 0) {
      res.json({ success: true, data: result });
    } else {
      res.status(404).json({ message: "Consultant feedback not found." });
    }
  });
});

app.put("/individual/update-emergency-contact", (req, res) => {
  const { id, emergency_contact } = req.body;

  if (!id || !emergency_contact) {
    return res.status(400).json({
      success: false,
      message: "ID and emergency contact are required.",
    });
  }

  const sql = "UPDATE users SET emergency_contact = ? WHERE id = ?";
  const values = [emergency_contact, id];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error updating emergency contact:", err);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update emergency contact." });
    }

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "User not found." });
    }

    res.status(200).json({
      success: true,
      message: "Emergency contact updated successfully.",
    });
  });
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
