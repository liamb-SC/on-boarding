// TODO: import useForm from react-hook-form, yupResolver from
// @hookform/resolvers/yup, and the schema from ./signupSchema.js

// A signup form validated by the Yup schema. Call onSubmit(values) only
// with valid values, and show each field's error message in a
// <p role="alert"> right under that field.
export default function SignupForm({ onSubmit }) {
  // TODO: useForm({ resolver: yupResolver(signupSchema) })

  return (
    <form noValidate>
      <label>
        Email <input type="email" />
      </label>

      <label>
        Password <input type="password" />
      </label>

      <label>
        Confirm password <input type="password" />
      </label>

      <label>
        <input type="checkbox" /> I accept the terms
      </label>

      <button type="submit">Create account</button>
    </form>
  );
}
