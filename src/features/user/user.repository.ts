// import connectPostgres from "../../config/db";


// const pool = connectPostgres();
// interface CreateUserData {
//   name: string;
//   email: string;
//   password: string;
// }

// interface User {
//   id: string;
//   name: string;
//   email: string;
// }

// export const getUserById = async (id: string): Promise<User | undefined> => {

//   const result = await pool.query(
//     "SELECT id,name,email FROM users WHERE id=$1",
//     [id]
//   );

//   return result.rows[0];
// };

// export const getUserByEmail = async (email: string): Promise<any> => {

//   const result = await pool.query(
//     "SELECT * FROM users WHERE email=$1",
//     [email]
//   );

//   return result.rows[0];
// };

// export const createUser = async (data: CreateUserData): Promise<User> => {

//   const result = await pool.query(
//     "INSERT INTO users(name,email,password) VALUES($1,$2,$3) RETURNING id,name,email",
//     [data.name, data.email, data.password]
//   );

//   return result.rows[0];
// };