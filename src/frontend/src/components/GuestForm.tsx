import { ExternalBlob, PaymentMethod } from "@/backend";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useBackend } from "@/hooks/useBackend";
import { useAddGuest } from "@/hooks/useGuests";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ImagePlus, Loader2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

const MAX_IMAGES = 5;
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Guest {
  id: bigint;
  guestName: string;
  phoneNumber: string;
  address: string;
  idProofType: string;
  idProofNumber: string;
  idProofImageUrl: string[];
  checkInDate: string;
  checkInTime: string;
  checkOutDate: string;
  checkOutTime: string;
  roomNumber: string;
  roomType: string;
  numberOfGuests: bigint;
  purposeOfVisit: string;
  grcNumber: string;
  invoiceNumber: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  notes: string;
}

interface PendingImage {
  id: string;
  file: File;
  previewUrl: string;
  progress: number | null;
}

export interface GuestFormValues {
  guestName: string;
  phoneNumber: string;
  address: string;
  idProofType: string;
  idProofNumber: string;
  checkInDate: string;
  checkInTimeHHMM: string;
  checkInTimePeriod: "AM" | "PM";
  checkOutDate: string;
  checkOutTimeHHMM: string;
  checkOutTimePeriod: "AM" | "PM";
  roomNumber: string;
  roomType: string;
  numberOfGuests: string;
  purposeOfVisit: string;
  grcNumber: string;
  invoiceNumber: string;
  amountPaid: string;
  paymentMethod: PaymentMethod | "";
  notes: string;
}

interface GuestFormProps {
  mode: "add" | "edit";
  existingGuest?: Guest | null;
  guestId?: bigint;
}

const ID_PROOF_TYPES = [
  "Aadhaar",
  "Passport",
  "Driving License",
  "Voter ID",
  "Other",
];

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: PaymentMethod.Cash, label: "Cash" },
  { value: PaymentMethod.UPI, label: "UPI" },
  { value: PaymentMethod.Online, label: "Online" },
  { value: PaymentMethod.Card, label: "Card" },
  { value: PaymentMethod.Other, label: "Other" },
];

function parseTimeString(timeStr: string): {
  hhmm: string;
  period: "AM" | "PM";
} {
  if (!timeStr) return { hhmm: "", period: "AM" };
  const match = timeStr.match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i);
  if (match)
    return { hhmm: match[1], period: match[2].toUpperCase() as "AM" | "PM" };
  return { hhmm: timeStr, period: "AM" };
}

function buildTimeString(hhmm: string, period: "AM" | "PM"): string {
  if (!hhmm) return "";
  return `${hhmm} ${period}`;
}

/** Parse existing idProofImageUrl (array or legacy single string) into string[] */
function parseExistingImageUrls(raw: string | string[]): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (raw.startsWith("[")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      /* fall through */
    }
  }
  return raw ? [raw] : [];
}

interface MultiImageUploadProps {
  existingUrls: string[];
  pendingImages: PendingImage[];
  onAddFiles: (files: FileList) => void;
  onRemoveExisting: (url: string) => void;
  onRemovePending: (id: string) => void;
  totalCount: number;
}

function MultiImageUpload({
  existingUrls,
  pendingImages,
  onAddFiles,
  onRemoveExisting,
  onRemovePending,
  totalCount,
}: MultiImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canAddMore = totalCount < MAX_IMAGES;

  return (
    <div className="space-y-3" data-ocid="guest_form.id_proof_images_section">
      {(existingUrls.length > 0 || pendingImages.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {existingUrls.map((url, idx) => (
            <div
              key={url}
              className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-[4/3]"
              data-ocid={`guest_form.id_image_existing.${idx + 1}`}
            >
              <img
                src={url}
                alt={`ID proof ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => onRemoveExisting(url)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                aria-label="Remove image"
                data-ocid={`guest_form.id_image_remove_existing.${idx + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                #{idx + 1}
              </span>
            </div>
          ))}
          {pendingImages.map((img, idx) => (
            <div
              key={img.id}
              className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-[4/3]"
              data-ocid={`guest_form.id_image_pending.${idx + 1}`}
            >
              <img
                src={img.previewUrl}
                alt={`New ID proof ${existingUrls.length + idx + 1}`}
                className="w-full h-full object-cover"
              />
              {img.progress !== null && img.progress < 100 && (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1">
                  <div className="w-3/4 h-1.5 rounded-full bg-white/30 overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${img.progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-white">{img.progress}%</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              <button
                type="button"
                onClick={() => onRemovePending(img.id)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                aria-label="Remove image"
                data-ocid={`guest_form.id_image_remove_pending.${idx + 1}`}
              >
                <X className="w-3 h-3" />
              </button>
              <span className="absolute bottom-1.5 left-1.5 text-xs bg-black/60 text-white px-1.5 py-0.5 rounded">
                New #{existingUrls.length + idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}
      <label
        htmlFor="id-proof-file-input"
        className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg transition-colors ${
          canAddMore
            ? "border-border hover:border-primary/50 bg-card cursor-pointer"
            : "border-border/40 bg-muted/30 cursor-not-allowed opacity-60"
        }`}
        data-ocid="guest_form.id_proof_upload_dropzone"
      >
        <input
          ref={fileInputRef}
          id="id-proof-file-input"
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          disabled={!canAddMore}
          onChange={(e) => e.target.files && onAddFiles(e.target.files)}
          data-ocid="guest_form.id_proof_image_input"
        />
        <ImagePlus
          className={`w-6 h-6 ${
            canAddMore ? "text-primary/60" : "text-muted-foreground/40"
          }`}
        />
        <div className="text-center">
          <p
            className={`text-sm font-medium ${
              canAddMore ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            {totalCount === 0
              ? "Add ID proof images"
              : canAddMore
                ? "Add another image"
                : `Maximum ${MAX_IMAGES} images reached`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {canAddMore
              ? `${totalCount}/${MAX_IMAGES} · JPG, PNG, PDF`
              : `${totalCount}/${MAX_IMAGES} images`}
          </p>
        </div>
        {canAddMore && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 pointer-events-none"
            tabIndex={-1}
            data-ocid="guest_form.id_proof_upload_button"
          >
            <ImagePlus className="w-3.5 h-3.5" />
            Choose Files
          </Button>
        )}
      </label>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 pb-2 border-b border-border">
      {children}
    </h3>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-sm text-foreground font-medium">{label}</Label>
      {children}
    </div>
  );
}

interface TimePeriodInputProps {
  hhmm: string;
  period: "AM" | "PM";
  onHhmmChange: (v: string) => void;
  onPeriodChange: (v: "AM" | "PM") => void;
  id?: string;
}

function TimePeriodInput({
  hhmm,
  period,
  onHhmmChange,
  onPeriodChange,
  id,
}: TimePeriodInputProps) {
  return (
    <div className="flex gap-2">
      <Input
        id={id}
        type="time"
        value={hhmm}
        onChange={(e) => onHhmmChange(e.target.value)}
        className="flex-1 bg-card border-border"
      />
      <div className="flex rounded-md border border-border overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => onPeriodChange("AM")}
          className={`px-3 py-2 transition-colors ${
            period === "AM"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          AM
        </button>
        <button
          type="button"
          onClick={() => onPeriodChange("PM")}
          className={`px-3 py-2 transition-colors ${
            period === "PM"
              ? "bg-primary text-primary-foreground"
              : "bg-card text-foreground hover:bg-muted"
          }`}
        >
          PM
        </button>
      </div>
    </div>
  );
}

export function GuestForm({ mode, existingGuest, guestId }: GuestFormProps) {
  const navigate = useNavigate();
  const { backend, isLoading: backendLoading } = useBackend();
  const addGuestMutation = useAddGuest();

  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<
    "idle" | "saving" | "saved"
  >("idle");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const defaultValues: GuestFormValues = {
    guestName: "",
    phoneNumber: "",
    address: "",
    idProofType: "",
    idProofNumber: "",
    checkInDate: "",
    checkInTimeHHMM: "",
    checkInTimePeriod: "AM",
    checkOutDate: "",
    checkOutTimeHHMM: "",
    checkOutTimePeriod: "AM",
    roomNumber: "",
    roomType: "",
    numberOfGuests: "",
    purposeOfVisit: "",
    grcNumber: "",
    invoiceNumber: "",
    amountPaid: "",
    paymentMethod: "",
    notes: "",
  };

  const { control, register, handleSubmit, reset, watch } =
    useForm<GuestFormValues>({ defaultValues });

  // Pre-fill form for edit mode
  useEffect(() => {
    if (mode === "edit" && existingGuest) {
      const ci = parseTimeString(existingGuest.checkInTime);
      const co = parseTimeString(existingGuest.checkOutTime);
      reset({
        guestName: existingGuest.guestName,
        phoneNumber: existingGuest.phoneNumber,
        address: existingGuest.address,
        idProofType: existingGuest.idProofType,
        idProofNumber: existingGuest.idProofNumber,
        checkInDate: existingGuest.checkInDate,
        checkInTimeHHMM: ci.hhmm,
        checkInTimePeriod: ci.period,
        checkOutDate: existingGuest.checkOutDate,
        checkOutTimeHHMM: co.hhmm,
        checkOutTimePeriod: co.period,
        roomNumber: existingGuest.roomNumber,
        roomType: existingGuest.roomType,
        numberOfGuests: existingGuest.numberOfGuests
          ? String(existingGuest.numberOfGuests)
          : "",
        purposeOfVisit: existingGuest.purposeOfVisit,
        grcNumber: existingGuest.grcNumber,
        invoiceNumber: existingGuest.invoiceNumber,
        amountPaid: existingGuest.amountPaid
          ? String(existingGuest.amountPaid)
          : "",
        paymentMethod: existingGuest.paymentMethod,
        notes: existingGuest.notes,
      });
      setExistingImageUrls(
        parseExistingImageUrls(existingGuest.idProofImageUrl),
      );
    }
  }, [mode, existingGuest, reset]);

  const buildGuestInput = useCallback(
    (values: GuestFormValues, imagePayload?: unknown) => ({
      guestName: values.guestName,
      phoneNumber: values.phoneNumber,
      address: values.address,
      idProofType: values.idProofType,
      idProofNumber: values.idProofNumber,
      idProofImageUrl: (imagePayload ?? []) as string[],
      checkInDate: values.checkInDate,
      checkInTime: buildTimeString(
        values.checkInTimeHHMM,
        values.checkInTimePeriod,
      ),
      checkOutDate: values.checkOutDate,
      checkOutTime: buildTimeString(
        values.checkOutTimeHHMM,
        values.checkOutTimePeriod,
      ),
      roomNumber: values.roomNumber,
      roomType: values.roomType,
      numberOfGuests: values.numberOfGuests
        ? BigInt(values.numberOfGuests)
        : BigInt(0),
      purposeOfVisit: values.purposeOfVisit,
      grcNumber: values.grcNumber,
      invoiceNumber: values.invoiceNumber,
      amountPaid: values.amountPaid ? Number.parseFloat(values.amountPaid) : 0,
      paymentMethod: (values.paymentMethod ||
        PaymentMethod.Cash) as PaymentMethod,
      notes: values.notes,
    }),
    [],
  );

  useEffect(() => {
    if (mode !== "edit" || !guestId) return;
    const subscription = watch((values) => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      autoSaveTimerRef.current = setTimeout(async () => {
        if (!backend) return;
        setAutoSaveStatus("saving");
        try {
          const input = buildGuestInput(
            values as GuestFormValues,
            existingImageUrls,
          );
          await backend.updateGuest(guestId, input);
          setAutoSaveStatus("saved");
          setTimeout(() => setAutoSaveStatus("idle"), 2000);
        } catch {
          setAutoSaveStatus("idle");
        }
      }, 1000);
    });
    return () => subscription.unsubscribe();
  }, [mode, guestId, backend, watch, buildGuestInput, existingImageUrls]);

  const handleAddFiles = (files: FileList) => {
    const remaining =
      MAX_IMAGES - existingImageUrls.length - pendingImages.length;
    const toAdd = Array.from(files).slice(0, remaining);
    const newPending: PendingImage[] = toAdd.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      progress: null,
    }));
    setPendingImages((prev) => [...prev, ...newPending]);
  };

  const handleRemoveExisting = (url: string) => {
    setExistingImageUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleRemovePending = (id: string) => {
    setPendingImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.previewUrl);
      return prev.filter((i) => i.id !== id);
    });
  };

  const uploadPendingImages = async (): Promise<(ExternalBlob | string)[]> => {
    if (!backend || pendingImages.length === 0) return [];
    const results: (ExternalBlob | string)[] = [];
    for (const img of pendingImages) {
      const bytes = new Uint8Array(await img.file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) => {
        setPendingImages((prev) =>
          prev.map((p) => (p.id === img.id ? { ...p, progress: pct } : p)),
        );
      });
      results.push(blob);
    }
    return results;
  };

  const onSubmit = async (values: GuestFormValues) => {
    if (!backend) {
      toast.error("Backend not connected. Please try again.");
      return;
    }
    setIsSubmitting(true);
    try {
      const newBlobs = await uploadPendingImages();
      // Combine kept existing URLs + new blobs into an array.
      // Cast to satisfy current backend.d.ts string field; after bindgen
      // regenerates with array type, the cast can be removed.
      const allImages: (string | ExternalBlob)[] = [
        ...existingImageUrls,
        ...newBlobs,
      ];
      const input = buildGuestInput(values, allImages);

      if (mode === "add") {
        await addGuestMutation.mutateAsync(input);
        toast.success("Guest added successfully!");
      } else if (guestId) {
        await backend.updateGuest(guestId, input);
        toast.success("Guest updated successfully!");
      }
      navigate({ to: "/guests" });
    } catch (err) {
      console.error(err);
      toast.error("Failed to save guest. Please try again.");
    } finally {
      setIsSubmitting(false);
      setPendingImages((prev) => prev.map((p) => ({ ...p, progress: null })));
    }
  };

  const totalImageCount = existingImageUrls.length + pendingImages.length;
  const isLoading = isSubmitting || backendLoading;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="relative">
      {/* Auto-save status — edit mode only */}
      {mode === "edit" && autoSaveStatus !== "idle" && (
        <div
          className="absolute top-0 right-0 flex items-center gap-1.5 text-xs text-muted-foreground"
          data-ocid="guest_form.autosave_status"
        >
          {autoSaveStatus === "saving" ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Saving…
            </>
          ) : (
            <>
              <CheckCircle2 className="w-3 h-3 text-green-600" />
              Saved
            </>
          )}
        </div>
      )}

      <div className="space-y-8">
        {/* Personal Info */}
        <section>
          <SectionHeading>Personal Info</SectionHeading>
          <div className="space-y-4">
            <FieldRow>
              <Field label="Guest Name">
                <Input
                  {...register("guestName")}
                  placeholder="e.g. Rajesh Kumar"
                  className="bg-card border-border"
                  data-ocid="guest_form.guest_name_input"
                />
              </Field>
              <Field label="Phone Number">
                <Input
                  {...register("phoneNumber")}
                  placeholder="e.g. 9876543210"
                  className="bg-card border-border"
                  data-ocid="guest_form.phone_number_input"
                />
              </Field>
            </FieldRow>
            <Field label="Address">
              <Input
                {...register("address")}
                placeholder="Full address"
                className="bg-card border-border"
                data-ocid="guest_form.address_input"
              />
            </Field>
          </div>
        </section>

        {/* ID Proof */}
        <section>
          <SectionHeading>ID Proof</SectionHeading>
          <div className="space-y-4">
            <FieldRow>
              <Field label="ID Proof Type">
                <Controller
                  control={control}
                  name="idProofType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className="bg-card border-border"
                        data-ocid="guest_form.id_proof_type_select"
                      >
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_PROOF_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="ID Proof Number">
                <Input
                  {...register("idProofNumber")}
                  placeholder="e.g. XXXX-XXXX-XXXX"
                  className="bg-card border-border"
                  data-ocid="guest_form.id_proof_number_input"
                />
              </Field>
            </FieldRow>

            <Field label={`ID Proof Images (up to ${MAX_IMAGES})`}>
              <MultiImageUpload
                existingUrls={existingImageUrls}
                pendingImages={pendingImages}
                onAddFiles={handleAddFiles}
                onRemoveExisting={handleRemoveExisting}
                onRemovePending={handleRemovePending}
                totalCount={totalImageCount}
              />
            </Field>
          </div>
        </section>

        {/* Stay Details */}
        <section>
          <SectionHeading>Stay Details</SectionHeading>
          <div className="space-y-4">
            <FieldRow>
              <Field label="Check-in Date">
                <Input
                  {...register("checkInDate")}
                  type="date"
                  className="bg-card border-border"
                  data-ocid="guest_form.check_in_date_input"
                />
              </Field>
              <Field label="Check-in Time">
                <Controller
                  control={control}
                  name="checkInTimeHHMM"
                  render={({ field: hField }) => (
                    <Controller
                      control={control}
                      name="checkInTimePeriod"
                      render={({ field: pField }) => (
                        <TimePeriodInput
                          id="checkInTime"
                          hhmm={hField.value}
                          period={pField.value}
                          onHhmmChange={hField.onChange}
                          onPeriodChange={pField.onChange}
                        />
                      )}
                    />
                  )}
                />
              </Field>
            </FieldRow>

            <FieldRow>
              <Field label="Check-out Date">
                <Input
                  {...register("checkOutDate")}
                  type="date"
                  className="bg-card border-border"
                  data-ocid="guest_form.check_out_date_input"
                />
              </Field>
              <Field label="Check-out Time">
                <Controller
                  control={control}
                  name="checkOutTimeHHMM"
                  render={({ field: hField }) => (
                    <Controller
                      control={control}
                      name="checkOutTimePeriod"
                      render={({ field: pField }) => (
                        <TimePeriodInput
                          id="checkOutTime"
                          hhmm={hField.value}
                          period={pField.value}
                          onHhmmChange={hField.onChange}
                          onPeriodChange={pField.onChange}
                        />
                      )}
                    />
                  )}
                />
              </Field>
            </FieldRow>

            <FieldRow>
              <Field label="Room Number">
                <Input
                  {...register("roomNumber")}
                  placeholder="e.g. 101"
                  className="bg-card border-border"
                  data-ocid="guest_form.room_number_input"
                />
              </Field>
              <Field label="Room Type">
                <Input
                  {...register("roomType")}
                  placeholder="e.g. Deluxe Suite"
                  className="bg-card border-border"
                  data-ocid="guest_form.room_type_input"
                />
              </Field>
            </FieldRow>

            <FieldRow>
              <Field label="Number of Guests">
                <Input
                  {...register("numberOfGuests")}
                  type="number"
                  min="1"
                  placeholder="1"
                  className="bg-card border-border"
                  data-ocid="guest_form.number_of_guests_input"
                />
              </Field>
              <Field label="Purpose of Visit">
                <Input
                  {...register("purposeOfVisit")}
                  placeholder="e.g. Leisure, Business"
                  className="bg-card border-border"
                  data-ocid="guest_form.purpose_of_visit_input"
                />
              </Field>
            </FieldRow>

            <FieldRow>
              <Field label="GRC Number">
                <Input
                  {...register("grcNumber")}
                  placeholder="e.g. GRC-2024-001"
                  className="bg-card border-border"
                  data-ocid="guest_form.grc_number_input"
                />
              </Field>
              <Field label="Invoice Number">
                <Input
                  {...register("invoiceNumber")}
                  placeholder="e.g. INV-001"
                  className="bg-card border-border"
                  data-ocid="guest_form.invoice_number_input"
                />
              </Field>
            </FieldRow>
          </div>
        </section>

        {/* Payment */}
        <section>
          <SectionHeading>Payment</SectionHeading>
          <div className="space-y-4">
            <FieldRow>
              <Field label="Amount Paid (₹)">
                <Input
                  {...register("amountPaid")}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="bg-card border-border"
                  data-ocid="guest_form.amount_paid_input"
                />
              </Field>
              <Field label="Payment Method">
                <Controller
                  control={control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger
                        className="bg-card border-border"
                        data-ocid="guest_form.payment_method_select"
                      >
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYMENT_METHODS.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
            </FieldRow>
          </div>
        </section>

        {/* Notes */}
        <section>
          <SectionHeading>Notes</SectionHeading>
          <Field label="Additional Notes">
            <Textarea
              {...register("notes")}
              placeholder="Any additional notes about the guest or stay…"
              rows={4}
              className="bg-card border-border resize-none"
              data-ocid="guest_form.notes_textarea"
            />
          </Field>
        </section>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 mt-8 pt-6 border-t border-border">
        <Button
          type="submit"
          disabled={isLoading}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 min-w-[140px]"
          data-ocid="guest_form.submit_button"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving…
            </>
          ) : mode === "add" ? (
            "Add Guest"
          ) : (
            "Update Guest"
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate({ to: "/guests" })}
          disabled={isLoading}
          data-ocid="guest_form.cancel_button"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
