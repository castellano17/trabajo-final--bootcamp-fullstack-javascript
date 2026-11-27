"use client";

import { Field } from "@/components/forms/field";
import { FormField } from "@/components/forms/form-field";
import { FormStatusMessage } from "@/components/forms/form-status-message";
import { SubmitButton } from "@/components/forms/submit-button";
import {
  type FormAction,
  useFormAction,
} from "@/components/forms/use-form-action";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  type PlaceCategory,
  placeCategories,
  placeCategoryLabels,
} from "@/lib/places/categories";
import { mapsUrlMaxLength } from "@/lib/places/config";

type PlaceFormValues = {
  name: string;
  category: PlaceCategory;
  address: string;
  description: string;
  mapsUrl: string | null;
};

type PlaceFormProps = {
  action: FormAction;
  submitLabel: string;
  place?: PlaceFormValues;
};

export function PlaceForm({ action, submitLabel, place }: PlaceFormProps) {
  const { state, fieldErrors, handleSubmit, isPending } = useFormAction(action);

  return (
    <form onSubmit={handleSubmit} className="grid gap-4" noValidate>
      <FormField
        name="name"
        label="Nombre"
        maxLength={100}
        defaultValue={place?.name}
        required
        errors={fieldErrors.name}
      />
      <Field label="Categoría" errors={fieldErrors.category}>
        {(controlProps) => (
          <NativeSelect
            {...controlProps}
            name="category"
            defaultValue={place?.category ?? ""}
            required
          >
            <NativeSelectOption value="" disabled>
              Elige una categoría
            </NativeSelectOption>
            {placeCategories.map((category) => (
              <NativeSelectOption key={category} value={category}>
                {placeCategoryLabels[category]}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        )}
      </Field>
      <FormField
        name="address"
        label="Dirección"
        maxLength={200}
        defaultValue={place?.address}
        required
        errors={fieldErrors.address}
      />
      <FormField
        name="mapsUrl"
        label="Enlace de Google Maps (opcional)"
        type="url"
        inputMode="url"
        maxLength={mapsUrlMaxLength}
        placeholder="https://maps.app.goo.gl/…"
        defaultValue={place?.mapsUrl ?? ""}
        errors={fieldErrors.mapsUrl}
      />
      <Field label="Descripción" errors={fieldErrors.description}>
        {(controlProps) => (
          <Textarea
            {...controlProps}
            name="description"
            rows={4}
            maxLength={1000}
            defaultValue={place?.description}
          />
        )}
      </Field>
      <FormStatusMessage state={state} />
      <SubmitButton isPending={isPending} pendingLabel="Guardando…">
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
