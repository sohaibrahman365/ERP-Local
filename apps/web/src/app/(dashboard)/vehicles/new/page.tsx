"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createVehicleSchema, type CreateVehicleInput } from "@wise/shared";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Input,
  Label,
  Select,
  Textarea,
} from "@wise/ui";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

const CONDITION_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "CERTIFIED_PREOWNED", label: "Certified Pre-Owned" },
  { value: "USED_EXCELLENT", label: "Used - Excellent" },
  { value: "USED_GOOD", label: "Used - Good" },
  { value: "USED_FAIR", label: "Used - Fair" },
  { value: "SALVAGE", label: "Salvage" },
] as const;

const FUEL_TYPE_OPTIONS = [
  { value: "PETROL", label: "Petrol" },
  { value: "DIESEL", label: "Diesel" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ELECTRIC", label: "Electric" },
  { value: "CNG", label: "CNG" },
  { value: "LPG", label: "LPG" },
] as const;

const TRANSMISSION_OPTIONS = [
  { value: "AUTOMATIC", label: "Automatic" },
  { value: "MANUAL", label: "Manual" },
  { value: "CVT", label: "CVT" },
  { value: "DCT", label: "DCT" },
] as const;

const BODY_TYPE_OPTIONS = [
  { value: "SEDAN", label: "Sedan" },
  { value: "SUV", label: "SUV" },
  { value: "HATCHBACK", label: "Hatchback" },
  { value: "CROSSOVER", label: "Crossover" },
  { value: "TRUCK", label: "Truck" },
  { value: "VAN", label: "Van" },
  { value: "COUPE", label: "Coupe" },
  { value: "WAGON", label: "Wagon" },
  { value: "BUS", label: "Bus" },
] as const;

export default function NewVehiclePage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateVehicleInput>({
    resolver: zodResolver(createVehicleSchema),
    defaultValues: {
      listingType: "INDIVIDUAL",
      condition: "USED_GOOD",
      numOwners: 1,
      priceNegotiable: true,
      features: [],
      year: new Date().getFullYear(),
    },
  });

  const createVehicle = useMutation({
    mutationFn: async (payload: CreateVehicleInput) => {
      const { data } = await api.post("/vehicles", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Vehicle listing created successfully");
      router.push("/vehicles");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to create vehicle listing";
      toast.error(message);
    },
  });

  const onSubmit = (data: CreateVehicleInput) => {
    createVehicle.mutate(data);
  };

  const handleFeaturesChange = (value: string) => {
    const features = value
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    setValue("features", features, { shouldValidate: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vehicles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Vehicle Listing</h1>
          <p className="text-muted-foreground">
            Add a new vehicle to WiseWheels
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="listingType">Listing Type *</Label>
                <Select
                  value={watch("listingType")}
                  onChange={(e) =>
                    setValue(
                      "listingType",
                      e.target.value as CreateVehicleInput["listingType"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <option value="INDIVIDUAL">Individual</option>
                  <option value="DEALER">Dealer</option>
                </Select>
                {errors.listingType && (
                  <p className="text-sm text-destructive">
                    {errors.listingType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition">Condition *</Label>
                <Select
                  value={watch("condition")}
                  onChange={(e) =>
                    setValue(
                      "condition",
                      e.target.value as CreateVehicleInput["condition"],
                      { shouldValidate: true }
                    )
                  }
                >
                  {CONDITION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                {errors.condition && (
                  <p className="text-sm text-destructive">
                    {errors.condition.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  placeholder="e.g. Toyota"
                  {...register("make")}
                />
                {errors.make && (
                  <p className="text-sm text-destructive">
                    {errors.make.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  placeholder="e.g. Corolla"
                  {...register("model")}
                />
                {errors.model && (
                  <p className="text-sm text-destructive">
                    {errors.model.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="variantName">Variant</Label>
                <Input
                  id="variantName"
                  placeholder="e.g. Altis Grande"
                  {...register("variantName")}
                />
                {errors.variantName && (
                  <p className="text-sm text-destructive">
                    {errors.variantName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="e.g. 2023"
                  {...register("year", { valueAsNumber: true })}
                />
                {errors.year && (
                  <p className="text-sm text-destructive">
                    {errors.year.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  placeholder="e.g. White"
                  {...register("color")}
                />
                {errors.color && (
                  <p className="text-sm text-destructive">
                    {errors.color.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numOwners">Number of Owners</Label>
                <Input
                  id="numOwners"
                  type="number"
                  min={1}
                  placeholder="1"
                  {...register("numOwners", { valueAsNumber: true })}
                />
                {errors.numOwners && (
                  <p className="text-sm text-destructive">
                    {errors.numOwners.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technical Specs */}
        <Card>
          <CardHeader>
            <CardTitle>Technical Specifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="mileageKm">Mileage (km)</Label>
                <Input
                  id="mileageKm"
                  type="number"
                  min={0}
                  placeholder="e.g. 45000"
                  {...register("mileageKm", { valueAsNumber: true })}
                />
                {errors.mileageKm && (
                  <p className="text-sm text-destructive">
                    {errors.mileageKm.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fuelType">Fuel Type</Label>
                <Select
                  value={watch("fuelType") ?? ""}
                  onChange={(e) =>
                    setValue(
                      "fuelType",
                      e.target.value as CreateVehicleInput["fuelType"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <option value="" disabled>
                    Select fuel type
                  </option>
                  {FUEL_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                {errors.fuelType && (
                  <p className="text-sm text-destructive">
                    {errors.fuelType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="transmission">Transmission</Label>
                <Select
                  value={watch("transmission") ?? ""}
                  onChange={(e) =>
                    setValue(
                      "transmission",
                      e.target.value as CreateVehicleInput["transmission"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <option value="" disabled>
                    Select transmission
                  </option>
                  {TRANSMISSION_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                {errors.transmission && (
                  <p className="text-sm text-destructive">
                    {errors.transmission.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="engineCc">Engine CC</Label>
                <Input
                  id="engineCc"
                  type="number"
                  min={1}
                  placeholder="e.g. 1800"
                  {...register("engineCc", { valueAsNumber: true })}
                />
                {errors.engineCc && (
                  <p className="text-sm text-destructive">
                    {errors.engineCc.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bodyType">Body Type</Label>
                <Select
                  value={watch("bodyType") ?? ""}
                  onChange={(e) =>
                    setValue(
                      "bodyType",
                      e.target.value as CreateVehicleInput["bodyType"],
                      { shouldValidate: true }
                    )
                  }
                >
                  <option value="" disabled>
                    Select body type
                  </option>
                  {BODY_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </Select>
                {errors.bodyType && (
                  <p className="text-sm text-destructive">
                    {errors.bodyType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationCity">Registration City</Label>
                <Input
                  id="registrationCity"
                  placeholder="e.g. Lahore"
                  {...register("registrationCity")}
                />
                {errors.registrationCity && (
                  <p className="text-sm text-destructive">
                    {errors.registrationCity.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location & Price */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Price</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g. Lahore"
                  {...register("city")}
                />
                {errors.city && (
                  <p className="text-sm text-destructive">
                    {errors.city.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="area">Area</Label>
                <Input
                  id="area"
                  placeholder="e.g. DHA Phase 5"
                  {...register("area")}
                />
                {errors.area && (
                  <p className="text-sm text-destructive">
                    {errors.area.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (PKR) *</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  placeholder="e.g. 5500000"
                  {...register("price", { valueAsNumber: true })}
                />
                {errors.price && (
                  <p className="text-sm text-destructive">
                    {errors.price.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="priceNegotiable"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300"
                {...register("priceNegotiable")}
              />
              <Label htmlFor="priceNegotiable">Price is negotiable</Label>
            </div>
          </CardContent>
        </Card>

        {/* Description */}
        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the vehicle condition, history, and any other details"
                rows={5}
                {...register("description")}
              />
              {errors.description && (
                <p className="text-sm text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input
                id="features"
                placeholder="e.g. Sunroof, Leather Seats, Navigation, Cruise Control"
                onChange={(e) => handleFeaturesChange(e.target.value)}
              />
              {watch("features") && watch("features").length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {watch("features").map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              )}
              {errors.features && (
                <p className="text-sm text-destructive">
                  {errors.features.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-4">
          <Link href="/vehicles">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={createVehicle.isPending}>
            {createVehicle.isPending && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Create Listing
          </Button>
        </div>
      </form>
    </div>
  );
}
