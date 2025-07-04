import type { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any; // react-hook-form's UseFormRegisterReturn
  name: string;
  defaultValue?: string;
  error?: { message?: string }; // Adjusted to accept a simpler error object
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  disabled?: boolean | undefined
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
  disabled, // Added disabled to destructuring
}: InputFieldProps) => {
  return (
    <div className={hidden ? "hidden" : "flex flex-col gap-2 w-full"}>
      <label className="text-xs text-gray-500">{label}</label>
      <input
        type={type}
        {...register(name)}
        className="ring-[1.5px] ring-gray-300 p-2 rounded-md text-sm w-full"
        {...inputProps}
        defaultValue={defaultValue}
        disabled={disabled} // Pass disabled to the input
      />
      {error?.message && (
        <p className="text-xs text-red-400">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;
