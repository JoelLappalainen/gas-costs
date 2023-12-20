'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { set, useForm } from 'react-hook-form';
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
import { float } from '@/lib/validation';
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
  type Dictionary,
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
import React, {
  ButtonHTMLAttributes,
  ReactHTMLElement,
  useEffect,
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
  const [splittedGasPrice, setSplittedGasPrice] = useState({} as GasPriceInfo);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [fromSuggestions, setFromSuggestions] = useState([] as Prediction[]);
  const [toSuggestions, setToSuggestions] = useState([] as Prediction[]);
  const [fromSuggestionsOpen, setFromSuggestionsOpen] = useState(false);
  const [toSuggestionsOpen, setToSuggestionsOpen] = useState(false);
  const [selectedFromId, setSelectedFromId] = useState('');
  const [selectedToId, setSelectedToId] = useState('');
  const [distance, setDistance] = useState({} as Distance);
  const [userCoords, setUserCoords] = useState(
    {} as { latitude: number; longitude: number }
  );
  const [locationDenied, setLocationDenied] = useState(false);
  const [loadingUserLocation, setLoadingUserLocation] = useState(false);

  const { helsinki: helsinkiGasolineAvg, finland: finlandGasolineAvg } =
    averageGasPrice || {};

  const formSchemaTest = zodLocale.object({
    from: z
      .string()
      .refine((val) => val.length > 0 && selectedFromId.length > 0, {
        params: {
          type: 'requiredSelectionCustom',
        },
      }),
    to: z.string().refine((val) => val.length > 0 && selectedToId.length > 0, {
      params: {
        type: 'requiredSelectionCustom',
      },
    }),
    consumption: stringToNumber,
    gasPrice: stringToNumber,
    personAmount: z.coerce.number(),
  });

  const form = useForm<z.infer<typeof formSchemaTest>>({
    resolver: zodResolver(formSchemaTest),
    defaultValues: {
      from: '',
      to: '',
      consumption: 7.1,
      gasPrice: finlandGasolineAvg ? finlandGasolineAvg : 1.9,
      personAmount: 2,
    },
    mode: 'onChange',
  });

  console.log;

  const { clearErrors } = form;

  const handleLocationSearch = (input: string, inputName: string) => {
    if (inputName === 'from') {
      setFrom(input);
      setSelectedFromId('');
    } else {
      setTo(input);
      setSelectedToId('');
    }
    debouncedGoogleSearch(input, inputName);
  };

  const getCurrentLocation = () => {
    setLoadingUserLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setUserCoords({ latitude, longitude });
        const place = await getGoogleNearbyPlaces(latitude, longitude, locale);
        setFrom(place.name);
        setSelectedFromId(place.place_id);
        setLoadingUserLocation(false);
        form.setValue('from', place.name);
        clearErrors('from');
      },
      (error) => {
        setLocationDenied(true);
        setLoadingUserLocation(false);
        console.error(error);
      }
    );
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
      const { latitude = null, longitude = null } = userCoords;
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

  function onSubmit(values: z.infer<typeof formSchemaTest>) {
    if (distance.status !== 'OK') return;

    const distanceInKm = distance?.distance?.value / 1000;

    const gasPrice = splitGasPrice(
      distanceInKm,
      values.gasPrice,
      values.consumption,
      values.personAmount
    );
    setSplittedGasPrice(gasPrice);
    setIsResultDialogOpen(true);
  }

  // get distance between two locations
  useEffect(() => {
    if (!selectedFromId || !selectedToId) {
      setDistance({} as Distance);
      return;
    }

    const getDistance = async () => {
      const distance = await getGoogleDistance(
        selectedFromId,
        selectedToId,
        locale
      );
      setDistance(distance);
    };

    getDistance();
  }, [selectedFromId, selectedToId, locale]);

  // check if user has denied location access
  useEffect(() => {
    navigator.permissions.query({ name: 'geolocation' }).then((result) => {
      if (result.state === 'denied') {
        setLocationDenied(true);
      }
    });
  }, []);

  return (
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
                  <Input {...field} value={from} autoComplete="off" />
                </FormControl>
                <Button
                  onClick={() => {
                    setFrom('');
                    setSelectedFromId('');
                  }}
                  type="button"
                  size="icon"
                  className="h-6"
                >
                  <Delete className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  type="button"
                  className="h-6"
                  disabled={locationDenied || loadingUserLocation}
                  onClick={getCurrentLocation}
                >
                  {loadingUserLocation ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Locate className="h-4 w-4" />
                  )}
                </Button>
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
          setInputValue={setFrom}
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
                  <Input {...field} value={to} autoComplete="off" />
                </FormControl>
                <Button
                  onClick={() => {
                    setTo('');
                    setSelectedToId('');
                  }}
                  type="button"
                  size="icon"
                  className="h-6"
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
          setInputValue={setTo}
          clearErrors={() => clearErrors('to')}
        />

        {distance.status === 'OK' && (
          <p className="my-5 text-sm">
            {dictionary.distance}:{' '}
            <span className="text-success">{distance.distance.text} </span>
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
                <Input {...field} />
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
                <FormControl>
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
                      {splittedGasPrice.gasCostPerPerson?.toFixed(2)} €
                    </span>
                  </span>
                  <span>
                    {dictionary.total}:{' '}
                    {splittedGasPrice.totalGasCost?.toFixed(2)} €
                  </span>
                </section>
                <Separator className="my-3" />
                <section className="flex flex-col text-sm">
                  <span>
                    <span>{dictionary.tripLength}: </span>
                    <span>
                      {splittedGasPrice.details?.tripLength?.toFixed(2)} km
                    </span>
                  </span>
                  <span>
                    {dictionary.consumption}:{' '}
                    {splittedGasPrice.details?.consumption} l/100km
                  </span>
                  <span>
                    {dictionary.gasPrice}: {splittedGasPrice.details?.gasPrice}{' '}
                    €/l
                  </span>
                  <span>
                    {dictionary.personAmount}:{' '}
                    {splittedGasPrice.details?.persons}{' '}
                    {(splittedGasPrice.details?.persons === 1
                      ? dictionary.person
                      : dictionary.persons
                    ).toLowerCase()}
                  </span>
                </section>
              </div>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
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
