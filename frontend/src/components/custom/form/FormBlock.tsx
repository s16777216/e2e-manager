import { Button } from "src/components/ui/button";
import {
  FormProvider,
  useForm,
  useWatch,
  type Mode,
  type UseFormProps,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { DynamicIcon, type IconName } from "lucide-react/dynamic";
import clsx, { type ClassValue } from "clsx";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";

export interface FormBlockProps<T extends z.ZodTypeAny> {
  label: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  formSchema?: T;
  defaultValues?: UseFormProps<z.infer<T>>["defaultValues"];
  onSubmit?: (data: z.infer<T>) => void;
  submitText?: string;
  submitIcon?: IconName;
  showSubmitButton?: boolean;
  layout?: "vertical" | "horizontal";
  footerFront?: React.ReactNode;
  footerEnd?: React.ReactNode;
  className?: ClassValue;
  onChange?: (data: z.infer<T>) => unknown;
  mode?: Mode;
}

const FormBlock = <T extends z.ZodTypeAny>(props: FormBlockProps<T>) => {
  const {
    label,
    description,
    children,
    formSchema = z.object({}),
    defaultValues,
    onSubmit = () => {},
    submitText = "儲存",
    submitIcon = "save",
    showSubmitButton = true,
    layout = "horizontal",
    footerFront,
    footerEnd,
    className,
    onChange,
    mode,
  } = props;

  type FormDataType = z.infer<typeof formSchema>;

  const form = useForm<FormDataType>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues,
    mode,
  });

  // 使用 useWatch 監聽表單內部即時變更
  const watchedValues = useWatch<FormDataType>({ control: form.control });
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    if (onChangeRef.current && watchedValues) {
      onChangeRef.current(watchedValues);
    }
  }, [watchedValues]);

  return (
    <FieldSet
      className={cn(
        clsx("grid gap-10", {
          "grid-cols-1 lg:grid-cols-3": layout === "horizontal",
          "grid-cols-1": layout === "vertical",
        }),
        className,
      )}
    >
      <div className="flex flex-col space-y-1">
        <FieldLegend>{label}</FieldLegend>
        <FieldDescription>{description}</FieldDescription>
      </div>

      {/* Content */}
      <div className="space-y-6 lg:col-span-2">
        <form className="mx-auto" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <FormProvider {...form}>{children}</FormProvider>
            <Field orientation="horizontal" className="flex justify-end">
              {footerFront}
              {showSubmitButton && (
                <Button type="submit" className="max-sm:w-full">
                  <DynamicIcon name={submitIcon} />
                  {submitText}
                </Button>
              )}
              {footerEnd}
            </Field>
          </FieldGroup>
        </form>
      </div>
    </FieldSet>
  );
};

export default FormBlock;
