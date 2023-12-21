'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Delete, Loader2 as Loader, Locate } from 'lucide-react';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Separator } from '../../components/ui/separator';
import {
  GasPriceInfo,
  cn,
  getZodWithLocaleErrors,
  splitGasPrice,
  stringToNumber,
} from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import React, {
  ButtonHTMLAttributes,
  FocusEvent,
  MutableRefObject,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  type Prediction,
  getGoogleDistance,
  getGooglePlaces,
  Distance,
  getGoogleNearbyPlaces,
} from '@/lib/google';

import { SuggestionsPopover } from '@/components/SuggestionsPopover';
import { type FinlandAverageGasPrice } from './page';
import { Dictionary } from '@/dictionaries/en';
import { useGeolocation } from '@/lib/hooks';

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
  const [selectedFromId, setSelectedFromId] = useState('');
  const [selectedToId, setSelectedToId] = useState('');

  const {
    getCurrentLocation,
    error,
    loading: loadingUserLocation,
    location,
    blocked: blockedUserLocation,
  } = useGeolocation(false);

  const distance = useRef<Distance | null>(null);
  const result = useRef<GasPriceInfo | null>(null);

  const { helsinki: helsinkiGasolineAvg, finland: finlandGasolineAvg } =
    averageGasPrice || {};

  const formSchema = zodLocale.object({
    from: z
      .string()
      .refine((val) => val.length > 0 && selectedFromId.length > 0, {
        params: {
          type: 'customRequiredSelection',
        },
      }),
    to: z.string().refine((val) => val.length > 0 && selectedToId.length > 0, {
      params: {
        type: 'customRequiredSelection',
      },
    }),
    consumption: stringToNumber,
    gasPrice: stringToNumber,
    personAmount: z.coerce.number(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      from: '',
      to: '',
      consumption: 7.1,
      gasPrice: finlandGasolineAvg ? finlandGasolineAvg : 1.9,
      personAmount: 1,
    },
    mode: 'onTouched',
  });

  const { clearErrors } = form;

  const handleLocationSearch = (input: string, inputName: string) => {
    if (inputName === 'from') {
      form.setValue('from', input);
      setSelectedFromId('');
    } else {
      form.setValue('to', input);
      setSelectedToId('');
    }
    debouncedGoogleSearch(input, inputName);
  };

  const handleGetLocation = async () => {
    if (blockedUserLocation) return;

    try {
      const location = await getCurrentLocation();

      if (!location) return;

      const { latitude, longitude } = location;
      const { place_id, name } = await getGoogleNearbyPlaces(
        latitude,
        longitude,
        locale
      );

      setSelectedFromId(place_id);
      form.setValue('from', name);
      clearErrors('from');
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
        if (inputName === 'from') {
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
        longitude
      );
      if (status !== 'OK') return;

      if (inputName === 'from') {
        setFromSuggestions(predictions);
        setFromSuggestionsOpen(true);
      } else {
        setToSuggestions(predictions);
        setToSuggestionsOpen(true);
      }
    },
    750
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const currentDistance = distance.current;
    if (currentDistance?.status !== 'OK') return;

    const distanceInKm = currentDistance?.distance?.value / 1000;

    result.current = splitGasPrice(
      distanceInKm,
      values.gasPrice,
      values.consumption,
      values.personAmount
    );

    setIsResultDialogOpen(true);
  };

  // get distance between two locations
  useEffect(() => {
    if (!selectedFromId || !selectedToId) {
      distance.current = null;
      return;
    }

    const getDistance = async () => {
      const googleDistance = await getGoogleDistance(
        selectedFromId,
        selectedToId,
        locale
      );
      distance.current = googleDistance;
    };

    getDistance();
  }, [selectedFromId, selectedToId, locale]);

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
                <div className="flex gap-2 items-center">
                  <FormControl
                    onChange={(e) => {
                      handleLocationSearch(
                        (e.target as HTMLInputElement).value,
                        'from'
                      );
                    }}
                    onFocus={() => setFromSuggestionsOpen(true)}
                  >
                    <Input {...field} autoComplete="off" />
                    {/* value={from} */}
                  </FormControl>
                  <Button
                    onClick={() => {
                      form.setValue('from', '');
                      setSelectedFromId('');
                    }}
                    type="button"
                    size="icon"
                    className="h-6"
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
            setInputValue={(value) => form.setValue('from', value)}
            clearErrors={() => clearErrors('from')}
          />

          <FormField
            name="to"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{dictionary.to}</FormLabel>
                <div className="flex gap-2 items-center">
                  <FormControl
                    onChange={(e) => {
                      handleLocationSearch(
                        (e.target as HTMLInputElement).value,
                        'to'
                      );
                    }}
                    onFocus={() => setToSuggestionsOpen(true)}
                  >
                    <Input {...field} autoComplete="off" />
                  </FormControl>
                  <Button
                    onClick={() => {
                      form.setValue('to', '');
                      setSelectedToId('');
                    }}
                    type="button"
                    size="icon"
                    className="h-6"
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
            setInputValue={(value) => form.setValue('to', value)}
            clearErrors={() => clearErrors('to')}
          />

          {distance.current?.status === 'OK' && (
            <p className="my-5 text-sm">
              {dictionary.distance}:{' '}
              <span className="text-success">
                {distance.current.distance.text}{' '}
              </span>
              <span className="text-xs text-muted-foreground">
                ({dictionary.source}: Google Maps)
              </span>
            </p>
          )}

          <Separator className="my-8" />

          <h2 className="text-xl font-bold">{dictionary.car}</h2>

          <FormField
            name="consumption"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>{dictionary.consumption}</FormLabel>
                <FormControl>
                  <Input {...field} onFocus={selectAllOnFocus} />
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
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {finlandGasolineAvg && (
            <GasPriceButton
              onClick={() =>
                form.setValue('gasPrice', finlandGasolineAvg, {
                  shouldValidate: true,
                })
              }
              selected={form.getValues('gasPrice') === finlandGasolineAvg}
            >
              {dictionary.finlandAvg}
            </GasPriceButton>
          )}
          {helsinkiGasolineAvg && (
            <GasPriceButton
              onClick={() =>
                form.setValue('gasPrice', helsinkiGasolineAvg, {
                  shouldValidate: true,
                })
              }
              selected={form.getValues('gasPrice') === helsinkiGasolineAvg}
            >
              {dictionary.helsinkiAvg}
            </GasPriceButton>
          )}
          {(finlandGasolineAvg || helsinkiGasolineAvg) && (
            <p className="text-xs mt-2 text-muted-foreground">
              ({dictionary.source}:{' '}
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
    </>
  );
}

interface GasPriceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected: boolean;
}

function GasPriceButton({ children, onClick, selected }: GasPriceButtonProps) {
  const selectedClasses = selected ? 'outline outline-success-dark' : '';
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className={cn('mt-4 mr-2 text-xs', selectedClasses)}
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
            className={cn(
              'h-6 w-8',
              blocked ? 'cursor-not-allowed opacity-50' : ''
            )}
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
                {dictionary.consumption}: {currentResult.details?.consumption}{' '}
                l/100km
              </span>
              <span>
                {dictionary.gasPrice}: {currentResult.details?.gasPrice} €/l
              </span>
              <span>
                {dictionary.personAmount}: {currentResult.details?.persons}{' '}
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
