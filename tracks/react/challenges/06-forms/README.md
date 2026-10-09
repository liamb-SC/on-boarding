# 06 · Forms: React Hook Form + Yup (and a look at Zod)

**Skills:** React Hook Form (`useForm`, `register`, `handleSubmit`,
`formState.errors`), schema validation with Yup, resolvers, cross-field
rules, accessible error messages.

## Background
Writing forms by hand with `useState` per field gets noisy fast: values,
touched flags, errors, submit state. **React Hook Form** (RHF) handles that.
Inputs stay uncontrolled and register themselves, so typing doesn't
re-render the whole form:

```jsx
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: yupResolver(schema),     // validate with a schema
});
<form onSubmit={handleSubmit(onValid)}>     {/* onValid only gets valid data */}
  <input {...register('email')} />          {/* name, ref, onChange, onBlur */}
  {errors.email && <p role="alert">{errors.email.message}</p>}
</form>
```

The rules live in a **schema**, a plain object you can also reuse on the
server or in tests. With **Yup**:

```js
yup.object({
  age: yup.number().required('Age is required').min(18, 'Must be 18+'),
  repeat: yup.string().oneOf([yup.ref('password')], 'Must match'), // refer to another field
});
```

**Zod** is the other popular choice, especially in TypeScript codebases,
because it infers the form's type from the schema. It plugs into RHF the same
way:

```js
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
const schema = z.object({ email: z.string().email('Enter a valid email') });
useForm({ resolver: zodResolver(schema) });
```

## Scenario
`src/SignupForm.jsx` renders the fields but validates nothing and never
submits. `src/signupSchema.js` lists the rules and messages, but the schema
itself is still missing.

## Goal
1. Export `signupSchema` from `src/signupSchema.js`: a Yup object with
   `email`, `password`, `confirmPassword` and `terms`, using exactly the
   messages in the file's comment.
2. Wire `SignupForm` up with `useForm` and `yupResolver(signupSchema)`:
   - register each input under those names;
   - submitting calls `onSubmit(values)` only when everything is valid;
   - each error shows as `<p role="alert">message</p>` under its field;
   - an invalid input has `aria-invalid="true"`, so screen readers announce
     it.

Keep the labels and the button text as they are. Run `npm run dev` and try to
break the form.

## Hints
- `handleSubmit(onSubmit)` goes on the `<form>`'s `onSubmit`.
- `register('terms')` on a checkbox gives you `true`/`false`.
  `yup.boolean().oneOf([true], ...)` means "must be ticked".
- After the first submit, RHF re-validates as you type, so fixed errors
  disappear straight away.
- Bonus (not checked): `npm i zod`, write the same schema with Zod, and
  swap in `zodResolver`. The form shouldn't need any other change. Do it
  after you pass, on a git branch, since the validator checks for Yup.

## Check your work
```
./onboard validate react/06
```
