import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import React from "react";
import {
  type FieldValues,
  type ControllerRenderProps,
  Controller,
  useFormContext,
} from "react-hook-form";
import type { ClassValue } from "clsx";
import { cn } from "@/lib/utils";

export interface FormFieldProps {
  name: string;
  label: string;
  description?: string | React.ReactNode;
  children?:
    | React.ReactElement
    | ((
        field: ControllerRenderProps<FieldValues, string>,
        id: string,
      ) => React.ReactNode);
  className?: ClassValue;
}

function FormField(props: FormFieldProps) {
  const { name, label, description, children, className = "" } = props;
  const form = useFormContext();

  if (!form) {
    throw new Error("FormField must be used within FormBlock");
  }

  const id = `form-field-${name}`;

  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={cn(className)}>
          {label && <FieldLabel htmlFor={id}>{label}</FieldLabel>}
          {children &&
            (React.isValidElement(children)
              ? React.cloneElement(children, {
                  ...field,
                  id,
                } as Partial<unknown>)
              : children(field, id))}
          {description && <FieldDescription>{description}</FieldDescription>}
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

export default FormField;
