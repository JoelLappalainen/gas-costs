"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Delete, Loader2 as Loader, Locate } from "lucide-react";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Separator } from "../../components/ui/separator";
import {
  GasPriceInfo,
  cn,
  getZodWithLocaleErrors,
  splitGasPrice,
  coercedNumberWithMin,
  roundNumber,
} from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import React, {
  ButtonHTMLAttributes,
  FocusEvent,
  MutableRefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  type Prediction,
  getGoogleDistance,
  getGooglePlaces,
  getGoogleNearbyPlace,
} from "@/lib/google";

import { SuggestionsPopover } from "@/components/SuggestionsPopover";
import { type FinlandAverageGasPrice } from "./page";
import { Dictionary } from "@/dictionaries/en";
import { useGeolocation } from "@/lib/hooks";
import AlertDialog from "@/components/AlertDialog";

export function GasForm({
  locale,
  dictionary,
  averageGasPrice,
}: {
  locale: string;
  dictionary: Dictionary;
  averageGasPrice: FinlandAverageGasPrice;
}) {
  const zodLocale = getZodWithLocaleErrors(dictionary);

  const [isResultDialogOpen, setIsResultDialogOpen] = useState(false);
  const [fromSuggestions, setFromSuggestions] = useState([] as Prediction[]);
  const [fromSuggestionsOpen, setFromSuggestionsOpen] = useState(false);
  const [toSuggestions, setToSuggestions] = useState([] as Prediction[]);
  const [toSuggestionsOpen, setToSuggestionsOpen] = useState(false);
  const [selectedFromId, setSelectedFromId] = useState("");
  const [selectedToId, setSelectedToId] = useState("");
  const [distanceIsFromGoogle, setDistanceIsFromGoogle] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertContent, setAlertContent] = useState<{
    title: string;
    message: string;
  }>({
    title: "",
    message: "",
  });

  const {
    getCurrentLocation,
    error,
    loading: loadingUserLocation,
    location,
    blocked: blockedUserLocation,
  } = useGeolocation(false);

  const result = useRef<GasPriceInfo | null>(null);

  const { helsinki: helsinkiGasolineAvg, finland: finlandGasolineAvg } =
    averageGasPrice || {};

  const defaultGasPrice = finlandGasolineAvg
    ? finlandGasolineAvg
    : helsinkiGasolineAvg
      ? helsinkiGasolineAvg
      : 1.9;

  const formSchema = zodLocale.object({
    from: z.string().optional(),
    to: z.string().optional(),
    distance: coercedNumberWithMin(0.1),
    consumption: coercedNumberWithMin(0.1),
    gasPrice: coercedNumberWithMin(0.1),
    personAmount: z.coerce.number(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: "",
      to: "",
      distance: 0,
      consumption: 7.1,
      gasPrice: defaultGasPrice,
      personAmount: 1,
    },
    mode: "onTouched",
  });

  const { trigger } = form;

  const handleGetLocation = async () => {
    if (blockedUserLocation) return;

    try {
      const location = await getCurrentLocation();

      if (!location) return;

      const { latitude, longitude } = location;
      const googlePlace = await getGoogleNearbyPlace(
        latitude,
        longitude,
        locale,
      );

      const { place_id, name, vicinity } = googlePlace;

      setSelectedFromId(place_id);
      form.setValue("from", `${name}, ${vicinity}`);
    } catch (error) {
      console.log(error);
    }
  };

  const selectAllOnFocus = (e: FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const debouncedGoogleSearch = useDebouncedCallback(
    async (input: string, inputName: string) => {
      if (!input) {
        if (inputName === "from") {
          setFromSuggestions([]);
          return;
        } else {
          setToSuggestions([]);
          return;
        }
      }
      const { latitude = null, longitude = null } = location || {};
      const { predictions, status } = await getGooglePlaces(
        input,
        locale,
        latitude,
        longitude,
      );
      if (status !== "OK") return;

      if (inputName === "from") {
        setFromSuggestions(predictions);
        setFromSuggestionsOpen(true);
      } else {
        setToSuggestions(predictions);
        setToSuggestionsOpen(true);
      }
    },
    750,
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    result.current = splitGasPrice(
      values.distance,
      values.gasPrice,
      values.consumption,
      values.personAmount,
    );

    setIsResultDialogOpen(true);
  };

  // get distance between two locations and set it to form's distance field
  useEffect(() => {
    if (!selectedFromId || !selectedToId) return;

    const getDistance = async () => {
      const googleDistance = await getGoogleDistance(
        selectedFromId,
        selectedToId,
        locale,
      );
      if (googleDistance.status === "OK") {
        const googleDistanceInKm = googleDistance.distance.value / 1000;
        form.setValue("distance", roundNumber(googleDistanceInKm), {
          shouldValidate: true,
        });
        setDistanceIsFromGoogle(true);
      } else if (googleDistance.status === "ZERO_RESULTS") {
        setAlertContent({
          title: dictionary.noDistanceFound,
          message: dictionary.noDistanceFoundMessage,
        });
        setAlertOpen(true);
      }
    };

    getDistance();
  }, [selectedFromId, selectedToId, locale, form, dictionary]);

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-[350px]"
        >
          <h2 className="text-xl font-bold">{dictionary.trip}</h2>

          <FormField
            name="from"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{dictionary.from}</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl
                    onChange={(e) => {
                      debouncedGoogleSearch(
                        (e.target as HTMLInputElement).value,
                        "from",
                      );
                    }}
                    onFocus={() => setFromSuggestionsOpen(true)}
                  >
                    <Input {...field} autoComplete="off" />
                    {/* value={from} */}
                  </FormControl>
                  <Button
                    onClick={() => {
                      form.setValue("from", "");
                      setSelectedFromId("");
                    }}
                    type="button"
                    size="icon"
                    aria-label={dictionary.clearField}
                  >
                    <Delete className="h-4 w-4" />
                  </Button>
                  <LocationButton
                    onClick={handleGetLocation}
                    loading={loadingUserLocation}
                    blocked={blockedUserLocation}
                    dictionary={dictionary}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <SuggestionsPopover
            open={fromSuggestionsOpen}
            setOpen={setFromSuggestionsOpen}
            suggestions={fromSuggestions}
            selectedSuggestionId={selectedFromId}
            setSelectedSuggestionId={setSelectedFromId}
            setInputValue={(value) => form.setValue("from", value)}
          />

          <FormField
            name="to"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{dictionary.to}</FormLabel>
                <div className="flex items-center gap-2">
                  <FormControl
                    onChange={(e) => {
                      debouncedGoogleSearch(
                        (e.target as HTMLInputElement).value,
                        "to",
                      );
                    }}
                    onFocus={() => setToSuggestionsOpen(true)}
                  >
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <Button
                    onClick={() => {
                      form.setValue("to", "");
                      setSelectedToId("");
                    }}
                    type="button"
                    size="icon"
                    aria-label={dictionary.clearField}
                  >
                    <Delete className="h-4 w-4" />
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <SuggestionsPopover
            open={toSuggestionsOpen}
            setOpen={setToSuggestionsOpen}
            suggestions={toSuggestions}
            selectedSuggestionId={selectedToId}
            setSelectedSuggestionId={setSelectedToId}
            setInputValue={(value) => form.setValue("to", value)}
          />

          <FormField
            name="distance"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{dictionary.distance}</FormLabel>
                <FormControl
                  onChange={() => setDistanceIsFromGoogle(false)}
                  onFocus={selectAllOnFocus}
                >
                  <Input {...field} type="number" />
                </FormControl>
                <FormMessage>
                  {distanceIsFromGoogle ? (
                    <span className="text-xs text-muted-foreground">
                      ({dictionary.source}: Google Maps)
                    </span>
                  ) : null}
                </FormMessage>
              </FormItem>
            )}
          />

          <Separator className="my-8" />

          <h2 className="text-xl font-bold">{dictionary.car}</h2>

          <FormField
            name="consumption"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{dictionary.consumption}</FormLabel>
                <FormControl onFocus={selectAllOnFocus}>
                  <Input {...field} type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="personAmount"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{dictionary.personAmount}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value.toString()}
                >
                  <FormControl
                    aria-label={`${dictionary.openSelect}: ${dictionary.personAmount}`}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Array.from({ length: 9 }, (_, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="gasPrice"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{dictionary.gasPrice}</FormLabel>
                <FormControl onBlur={() => trigger("gasPrice")}>
                  <Input {...field} type="number" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {finlandGasolineAvg && (
            <GasPriceButton
              onClick={() =>
                form.setValue("gasPrice", finlandGasolineAvg, {
                  shouldValidate: true,
                })
              }
              selected={
                Number(form.getValues("gasPrice")) === finlandGasolineAvg
              }
            >
              {dictionary.finlandAvg}
            </GasPriceButton>
          )}
          {helsinkiGasolineAvg && (
            <GasPriceButton
              onClick={() =>
                form.setValue("gasPrice", helsinkiGasolineAvg, {
                  shouldValidate: true,
                })
              }
              selected={
                Number(form.getValues("gasPrice")) === helsinkiGasolineAvg
              }
            >
              {dictionary.helsinkiAvg}
            </GasPriceButton>
          )}
          {(finlandGasolineAvg || helsinkiGasolineAvg) && (
            <p className="mt-2 text-xs text-muted-foreground">
              ({dictionary.source}:{" "}
              <a href="https://tankille.fi" target="_blank">
                tankille.fi
              </a>
              )
            </p>
          )}
          <Button type="submit" className="mt-8">
            {dictionary.calculate}
          </Button>
        </form>
      </Form>

      <ResultDialog
        {...{ dictionary, isResultDialogOpen, setIsResultDialogOpen, result }}
      />
      <AlertDialog {...alertContent} open={alertOpen} setOpen={setAlertOpen} />
    </>
  );
}

interface GasPriceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

function GasPriceButton({ children, onClick, selected }: GasPriceButtonProps) {
  const selectedClasses = selected ? "outline outline-success-dark" : "";
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn("mr-2 mt-4 text-xs", selectedClasses)}
      onClick={onClick}
    >
      {children}
    </Button>
  );
}

function LocationButton({
  onClick,
  loading,
  blocked,
  dictionary,
}: {
  onClick: () => void;
  loading: boolean;
  blocked: boolean;
  dictionary: Dictionary;
}) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            type="button"
            className={cn(blocked ? "cursor-not-allowed opacity-50" : "")}
            disabled={loading}
            onClick={onClick}
            aria-label={dictionary.getLocation}
          >
            {loading ? (
              <Loader className="h-4 w-4 animate-spin" />
            ) : (
              <Locate className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {blocked ? (
            <p>{dictionary.locationBlocked}</p>
          ) : (
            <p>{dictionary.getLocation}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function ResultDialog({
  dictionary,
  isResultDialogOpen,
  setIsResultDialogOpen,
  result,
}: {
  dictionary: Dictionary;
  isResultDialogOpen: boolean;
  setIsResultDialogOpen: (value: boolean) => void;
  result: MutableRefObject<GasPriceInfo | null>;
}) {
  const currentResult = result.current;
  if (!currentResult) return null;

  return (
    <Dialog
      open={isResultDialogOpen}
      onOpenChange={() => setIsResultDialogOpen(!isResultDialogOpen)}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dictionary.calculationTitle}</DialogTitle>

          <div className="text-muted-foreground">
            <section className="flex flex-col pt-4">
              <span>
                <span>{dictionary.person}: </span>
                <span className="text-success">
                  {currentResult.gasCostPerPerson?.toFixed(2)} €
                </span>
              </span>
              <span>
                {dictionary.total}: {currentResult.totalGasCost?.toFixed(2)} €
              </span>
            </section>
            <Separator className="my-3" />
            <section className="flex flex-col text-sm">
              <span>
                <span>{dictionary.tripLength}: </span>
                <span>{currentResult.details?.tripLength?.toFixed(2)} km</span>
              </span>
              <span>
                {dictionary.consumption}: {currentResult.details?.consumption}{" "}
                l/100km
              </span>
              <span>
                {dictionary.gasPrice}: {currentResult.details?.gasPrice} €/l
              </span>
              <span>
                {dictionary.personAmount}: {currentResult.details?.persons}{" "}
                {(currentResult.details?.persons === 1
                  ? dictionary.person
                  : dictionary.persons
                ).toLowerCase()}
              </span>
            </section>
          </div>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
