import * as yup from 'yup';

// The rules, and the exact messages the form shows:
//   email            required -> "Email is required"
//                    format   -> "Enter a valid email"
//   password         required -> "Password is required"
//                    < 8 chars -> "Password must be at least 8 characters"
//   confirmPassword  required -> "Please confirm your password"
//                    differs  -> "Passwords must match"
//   terms            must be ticked -> "You must accept the terms"

// TODO: export const signupSchema = yup.object({ ... });
