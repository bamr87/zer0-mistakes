Labelled text field for forms, search, and the config wizard.

```jsx
<Input label="Site title" placeholder="My Site" icon="globe"
  help="Shown in the navbar and browser tab." />
<Input label="Email" type="email" invalid help="Enter a valid email address." />
```

Focus shows the primary token ring (red when `invalid`). Pass `icon` for a leading Bootstrap Icon, `help` for helper/error text, `disabled` to mute the field. Controlled via `value` + `onChange`.
