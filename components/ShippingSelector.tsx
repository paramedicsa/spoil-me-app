import React, { useState, useEffect } from 'react';
import { Truck, MapPin, ChevronDown } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { ShippingAddress } from '../types';

// Data moved from Cart.tsx
const PAXI_LOCATIONS: Record<string, Record<string, string[]>> = {
    "Eastern Cape": {
        "Gqeberha (Port Elizabeth)": ["PEP Pier 14 (Ground Floor, 444 Govan Mbeki Ave)", "PEP Home Walmer Park (Shop 87A, Walmer Park Shopping Centre)", "PEP Greenacres", "PEP Newton Park", "PEP Summerstrand"],
        "East London": ["PEP EL CBD (32 Oxford St)", "PEP Hemingways Mall (Shop UG54, Hemingways Mall)", "PEP Vincent Park", "PEP Beacon Bay", "PEP Gonubie"],
        "Mthatha": ["PEP Mthatha BT Ngebs City (Shop 89, BT Ngebs City)", "PEP Mthatha Circus Triangle (Shop 7, Circus Triangle)", "PEP Mthatha Plaza"],
        "Makhanda (Grahamstown)": ["PEP Grahamstown High Street (48 High St)", "PEP Market Square"],
        "Queenstown (Komani)": ["PEP Queenstown Lukhanji Mall (Shop 45, Lukhanji Mall)"],
        "Uitenhage": ["PEP Uitenhage Mall", "PEP Corkwood Square"],
        "Jeffreys Bay": ["PEP Fountains Mall", "PEP Jeffrey's Bay CBD"],
        "King William's Town": ["PEP King William's Town CBD", "PEP Metlife Mall"]
    },
    "Free State": {
        "Bloemfontein": ["PEP BFN St Andrew St (45 St Andrew St)", "PEP Home Mimosa Mall (Mimosa Mall, 131 Kellner St)", "PEP Loch Logan", "PEP Fleurdal", "PEP Northridge Mall"],
        "Welkom": ["PEP Welkom Bok Street (Shop 22A, Bok Street)", "PEP Welkom Goldfields Mall (Shop U5, Goldfields Mall)", "PEP Boitumelo Junction"],
        "Bethlehem": ["PEP Bethlehem Dihlabeng Mall (Shop 52, Dihlabeng Mall)", "PEP Bethlehem CBD"],
        "Sasolburg": ["PEP Sasolburg (Shop 9 Sake Complex, Wandellaan Street)", "PEP Sasolburg Mall"],
        "Parys": ["PEP Parys (Cnr Kort Street & Middle Street)"],
        "Kroonstad": ["PEP Kroonstad Reitz Street (21 Reitz St)", "PEP Maokeng Mall"]
    },
    "Gauteng": {
        "Johannesburg": ["PEP JHB Carlton Centre (C/O Commissioner St & Kruis Sts)", "PEP Home Jabulani Mall (Shop 84, Jabulani Mall, Soweto)", "PEP Sandton City (Shop U12, Sandton City, Rivonia Rd)", "PEP Jozi CBD", "PEP Braamfontein", "PEP Rosebank Mall", "PEP Mellville", "PEP Cresta", "PEP Clearwater Mall"],
        "Pretoria": ["PEP PTA Central (Cnr Paul Kruger & Pretorius St)", "PEP Home Menlyn Park (Menlyn Park, Garsfontein Road)", "PEP Centurion Mall (Shop 15, Centurion Mall, Heuwel Ave)", "PEP Sunnyside", "PEP Brooklyn", "PEP Kolonnade", "PEP Wonderpark"],
        "Soweto": ["PEP Maponya Mall", "PEP Jabulani Mall", "PEP Bara Mall", "PEP Dobsonville"],
        "Centurion": ["PEP Centurion Mall", "PEP Lyttelton", "PEP Mall @ Reds", "PEP Forest Hill"],
        "Midrand": ["PEP Mall of Africa", "PEP Boulders", "PEP Midrand CBD"],
        "Benoni": ["PEP Benoni Lakeside Mall (Shop L20, Lakeside Mall, Tom Jones St)", "PEP Northmead Square"],
        "Boksburg": ["PEP East Rand Mall", "PEP Sunward Park"],
        "Krugersdorp": ["PEP Krugersdorp Cnr Ockerse (Cnr Ockerse & Human Street)", "PEP Krugersdorp Westgate (Shop 30, Westgate Shopping Centre)"],
        "Alberton": ["PEP Alberton City (SHOP L106, Alberton City, Voortrekker Street)"],
        "Vereeniging": ["PEP Vereeniging Arcon Park (Arcon Park Shopping Centre)", "PEP Vereeniging CBD (12 Joubert Street)"]
    },
    "KwaZulu-Natal": {
        "Durban": ["PEP Durban Dr Pixley Kaseme St (442 Dr Pixley Kaseme Street)", "PEP Bluff Towers (Shop 94 Bluff Twrs, 15 Tara Rd)", "PEP Home Pavilion (Shop L94, The Pavilion Shopping Centre)", "PEP Durban Workshop", "PEP Musgrave", "PEP Berea", "PEP South Beach", "PEP Ushaka"],
        "Umhlanga": ["PEP Gateway", "PEP Crescent", "PEP Cornubia"],
        "Pietermaritzburg": ["PEP PMB Liberty Mall (Shop 15, Liberty Midlands Mall)", "PEP PMB CBD (335 Church Street)", "PEP Greater Edendale"],
        "Richards Bay": ["PEP Cell Richards Bay Boardwalk (Shop U004, Boardwalk Inkwazi)", "PEP Richards Bay Checkers (Shop 17A, Checkers Centre)"],
        "Ballito": ["PEP Ballito Junction", "PEP Lifestyle Centre"],
        "Newcastle": ["PEP Newcastle Mall", "PEP Amajuba Mall"],
        "Port Shepstone": ["PEP Port Shepstone (Cnr Escombe & Wooley St)", "PEP South Coast Mall"],
        "Ladysmith": ["PEP Ladysmith Murchison Mall (Shop LG11, Murchison Mall)"],
        "Kokstad": ["PEP Kokstad Main Street (Shop 1 Spargs Building, 40 Main Street)"]
    },
    "Limpopo": {
        "Hoedspruit": ["PEP Hoedspruit (Wildlife Shop 12)", "PEP Hoedspruit Centre"],
        "Ohrigstad": ["PEP Ohrigstad (Potgieter St)"],
        "Metz": ["PEP Metz Mahlakung Shopping Centre (Shop 7)", "PEP Cell Metz (Shop 11)"],
        "Phalaborwa": ["PEP Home Ba-phalaborwa Eden Square (Shop 13)", "PEP Phalaborwa Shoprite Centre (Shop 8)", "PEP Phalaborwa Mall (Shop 5)", "PEP Cell Ba-phalaborwa (Shop 7C)", "PEP Ba-phalaborwa Checkers (Shop 9)", "PEP Phalaborwa Standard Bank Centre (Shop B1)", "PEP Ba-phalaborwa Namakwale Crossing (Shop 7)", "PEP Cell Phalaborwa Namakgale Crossing (Shop 26)", "PEP Lulekani Spar Centre (Shop A3)"],
        "Burgersfort": ["PEP Home Burgersfort Tubatse (Shop L50)", "PEP Cell Burgersfort Morone Centre (Shop 23A)", "PEP Burgersfort Morone Shopping Centre (Shop 5 & 6)", "PEP Burgersfort Twin City Mall (Shop 17)", "PEP Cell Burgersfort Twin City (Shop 5)", "PEP Cell Burgersfort Twin City Shop 41", "PEP Burgersfort Platinum Place (Shop 1-3)", "PEP Cell Burgersfort Castle Square (Shop 10)", "PEP Burgersfort Castle Square (Shop 8)", "PEP Burgersfort Burgersfort Mall (Shop 18)", "PEP Cell Burgersfort Mall (Shop 28)", "PEP Burgersfort Tubatse Mall (Shop L87)", "PEP Cell Burgersfort Tubatse Crossing (Shop L57)"],
        "Steelpoort": ["PEP Home Steelpoort (Steelpoort Centre)", "PEP Steelpoort (Shop 5)", "PEP Cell Steelpoort Shopping Centre (Shop 19)"],
        "Polokwane": ["PEP Polokwane CBD (Cnr Grobler & Thabo Mbeki St)", "PEP Mall of the North (Shop 10, Mall of the North)", "PEP Savanna Mall", "PEP Limpopo Mall"],
        "Tzaneen": ["PEP Tzaneen Tzaneng Mall (Shop B5, Tzaneng Mall, Danie Joubert St)", "PEP Tzaneen CBD", "PEP Tzaneen Crossing"],
        "Thohoyandou": ["PEP Thohoyandou Venda Plaza (Shop B1, Venda Plaza)", "PEP Home Thohoyandou (Next to Shoprite, Thohoyandou)", "PEP Thavhani Mall", "PEP Mvyu"],
        "Mokopane": ["PEP Mokopane Mall", "PEP Crossing"],
        "Makhado (Louis Trichardt)": ["PEP Louis Trichardt Burger Str (Cnr Burger St & Songozwi Rd)"]
    },
    "Mpumalanga": {
        "Acornhoek": ["PEP Home Acornhoek Mall (Shop 27)", "PEP Acornhoek Plaza Extension (Shop 75)", "PEP Cell Acornhoek Plaza (Shop 71)", "PEP Cell Acornhoek Mall (Shop 3)", "PEP Acornhoek Mall (Shop 10)", "PEP Cell Acornhoek Mall (Shop 33B)", "PEP Acornhoek Shopping Centre (Station Centre)", "PEP Cell Acornhoek Shopping Centre"],
        "Thulamahashe": ["PEP Cell Thulamahashe (Thula Mall)", "PEP Thulamahashe Thula Mall (Shop 17)", "PEP Cell Thulamahashe Plaza (Shop 103)", "PEP Thulamahashe (Plaza Shop 7)", "PEP Cell Thulamahashe Plaza (Shop 14)"],
        "Dwarsloop": ["PEP Home Dwarsloop Mall (Shop 208)", "PEP Dwarsloop Mall (Shop 66)", "PEP Cell Dwarsloop Mall (Shop 48)"],
        "Bushbuckridge": ["PEP Bushbuckridge Twin City Mall (Shop 9)", "PEP Cell Bushbuckridge Twin City Mall (Shop 2A)", "PEP Cell Bushbuckridge Shopping Centre (Shop 1B)", "PEP Bushbuckridge Shopping Centre (Shop 6)"],
        "Graskop": ["PEP Graskop (Spar Centre)"],
        "Mkhuhlu": ["PEP Cell Mkhuhlu (Plaza Shop 12)", "PEP Mkhuhlu (Plaza Shop 7)"],
        "Hazyview": ["PEP Home Hazyview Junction (Shop 5A)", "PEP Home Numbi Gate Dayizenza (Shop 7)", "PEP Hazyview Junction (Shop 14B)", "PEP Cell Lowveld Mall PNP (Shop 168)", "PEP Cell Lowveld Mall Spar (Shop 12)", "PEP Hazyview Blue Haze (Shop 304)", "PEP Hazyview Lowveld Mall (Shop 232)", "PEP Hazyview Lowveld Mall (Shop 155)", "PEP Numbigate Dayizenza Plaza (Shop 38A)", "PEP Cell Numbigate Dayizenza Plaza (Shop 12)"],
        "Sabie": ["PEP Sabie (Shopping Centre)"],
        "White River": ["PEP Home White River Square (Shop 20)", "PEP White River (Square Shop 17)", "PEP Whiteriver Square 1 (Shop 17)", "PEP White River Crossing (Shop 15)", "PEP White River Kabokweni (Plaza Shop 10)", "PEP Cell White River Kabokweni Plaza (Shop 205A)"],
        "Lydenburg (Mashishing)": ["PEP Home Lydenburg Lt Centre (Shop 5)", "PEP Lydenburg Highland Centre (Shop 6A)", "PEP Lydenburg (Tamarisk Building)", "PEP Cell Mashishing Shoprite Centre"],
        "Mbombela (Nelspruit)": ["PEP Home Riverside Mall Nelspruit (Shop G241)", "PEP Home Nelspruit Promenade (Shop 41 & 42)", "PEP Home Nelspruit Ilanga Mall (Shop LG36)", "PEP Home Nelspruit The Square (Shop 7)", "PEP Nelspruit The Grove (Shop 18)", "PEP Cell Nelspruit Plaza (Shop 28)", "PEP Nelspruit Plaza (Shop 17-20)", "PEP Cell Nelspruit Ekukhanyeni (Shop 5)", "PEP Nelspruit Brown & Henshall Street", "PEP Cell Nelspruit Promenade (Shop 49)", "PEP Nelspruit Brown Street (Prorom Building)", "PEP Nelspruit (Bester Brown Building)", "PEP Nelspruit The Square (Shop 10)", "PEP Nelspruit CBD", "PEP Riverside Mall (Shop U40)"],
        "Kanyamazane": ["PEP Kanyamazane (Shopping Centre Shop 11)"],
        "Emoyeni": ["PEP Emoyeni Mall (Shop 22)", "PEP Cell Emoyeni Mall (Shop 8)"],
        "eMalahleni (Witbank)": ["PEP Witbank Taxi Rank (Shop 1, 3 Escombe St)", "PEP Highveld Mall (Shop U03, Highveld Mall)", "PEP Witbank CBD", "PEP Saveways Crescent"],
        "Middelburg": ["PEP Home Middelburg Mall (Shop 97, Middelburg Mall)", "PEP Middelburg CBD (28 Cowen Ntuli Street)", "PEP Midwater"],
        "Secunda": ["PEP Secunda Mall (Shop 160, Secunda Mall)", "PEP Secunda CBD"]
    },
    "North West": {
        "Rustenburg": ["PEP Rustenburg Mall (Shop 73 Rustenburg Mall)", "PEP Waterfall Mall (Shop 12, Waterfall Mall)", "PEP Rustenburg CBD", "PEP Rustenburg Plaza", "PEP Platinum Square"],
        "Potchefstroom": ["PEP Potch Walter Sisulu Lane (149 Walter Sisulu Lane)", "PEP Home Mooirivier Mall (Shop 16, Mooirivier Mall)", "PEP Potch CBD"],
        "Mahikeng (Mafikeng)": ["PEP Mafikeng City Mall (Shop G10, Mafikeng City Mall)", "PEP Mmabatho Crossing (Shop 25, Mmabatho Crossing)", "PEP Mahikeng CBD", "PEP Mega City"],
        "Klerksdorp": ["PEP Klerksdorp Terminus (Shop 19, The Terminus Centre)", "PEP Klerksdorp CBD", "PEP Matlosana Mall", "PEP City Mall"],
        "Brits": ["PEP Brits Town Centre (Shop G2, Brits Town Centre)", "PEP Brits Mall"]
    },
    "Northern Cape": {
        "Kimberley": ["PEP North Cape Mall (Shop 60, North Cape Mall)", "PEP Home Diamond Pavilion Mall (Shop 93, Diamond Pavilion Mall)", "PEP Kimberley CBD", "PEP New Park"],
        "Upington": ["PEP Upington Mall (Shop 12, Upington Mall)", "PEP Upington CBD (20 Schroder Street)", "PEP Kalahari Mall"],
        "Kuruman": ["PEP Kuruman Beare Street (Shop 28B, Beare Street)", "PEP Kuruman Mall", "PEP The Eye"],
        "De Aar": ["PEP De Aar Main Road (35 Main Road, De Aar)"],
        "Springbok": ["PEP Springbok (62 Main Street, Springbok)"]
    },
    "Western Cape": {
        "Cape Town": ["PEP CPT Station (Cape Town Station Concourse)", "PEP Golden Acre (Shop 10, Golden Acre Mall)", "PEP Home Parow Centre (Shop G6, Parow Centre, Voortrekker Rd)", "PEP Gardens", "PEP V&A Waterfront", "PEP Canal Walk", "PEP Blue Route"],
        "Stellenbosch": ["PEP Eikestad Mall (Shop E4, Eikestad Mall, 43 Andringa Rd)", "PEP Kayamandi (Shop 11, Kayamandi Shopping Centre)", "PEP Stellenbosch Central"],
        "George": ["PEP George Garden Route Mall (Shop 2, Garden Route Mall)", "PEP George CBD (82 Hibernia Street)", "PEP York Street"],
        "Paarl": ["PEP Paarl Mall (Shop 12, Paarl Mall, Cnr Newvlei & Jones St)", "PEP Lady Grey", "PEP Rembrandt Mall"],
        "Hermanus": ["PEP Hermanus Whale Coast Mall (Shop 15, Whale Coast Mall)"],
        "Knysna": ["PEP Knysna Long Street (13 Long Street, Knysna)", "PEP Knysna Mall", "PEP Woodmill Lane"],
        "Somerset West": ["PEP Somerset Mall", "PEP Main Road", "PEP Waterstone"],
        "Mossel Bay": ["PEP Mossel Bay Mall", "PEP Langeberg Mall"],
        "Worcester": ["PEP Mountain Mill", "PEP Worcester CBD"]
    }
};

// --- START OF COPIED DATA FROM AdminExpenses.tsx ---
interface PudoCostItem { name: string; dimensions: string; maxWeight: string; boxCost: number; lockerToLockerCost: number | null; doorToLockerCost: number | null; lockerHandleFee: number; doorHandleFee: number; }
const INITIAL_PUDO_COSTS: PudoCostItem[] = [{ name: 'Extra-Small (XS)', dimensions: '60cm × 17cm × 8cm', maxWeight: '2kg', boxCost: 6, lockerToLockerCost: 49, doorToLockerCost: 69, lockerHandleFee: 0, doorHandleFee: 0 }, { name: 'Small (S)', dimensions: '60cm × 41cm × 8cm', maxWeight: '5kg', boxCost: 15, lockerToLockerCost: 59, doorToLockerCost: 79, lockerHandleFee: 0, doorHandleFee: 0 }, { name: 'Medium (M)', dimensions: '60cm × 41cm × 19cm', maxWeight: '10kg', boxCost: 18, lockerToLockerCost: null, doorToLockerCost: null, lockerHandleFee: 0, doorHandleFee: 0 },];
interface PaxiCostItem { bag: string; serviceCost: number; handleFee: number; }
interface PaxiServicesState { '7-9 Days Service': PaxiCostItem[]; '3-5 Days Service': PaxiCostItem[]; }
const INITIAL_PAXI_COSTS: PaxiServicesState = { '7-9 Days Service': [{ bag: 'Single Small Paxi Bags', serviceCost: 59.95, handleFee: 0 }, { bag: 'Single Large Paxi Bags', serviceCost: 89.95, handleFee: 0 },], '3-5 Days Service': [{ bag: 'Single Small Paxi Bags', serviceCost: 109.95, handleFee: 0 }, { bag: 'Single Large Paxi Bags', serviceCost: 139.95, handleFee: 0 },] };
interface PudoDoorToDoorItem { service: string; initialWeight: string; boxFee: number; initialCharge: number; ratePerKg: number | null; handleFee: number; }
const INITIAL_DOOR_TO_DOOR_COSTS: PudoDoorToDoorItem[] = [ { service: 'Overnight Courier (OVN)', initialWeight: 'Up to 2kg', boxFee: 6, initialCharge: 130.00, ratePerKg: 45.00, handleFee: 0 }, { service: 'Economy Road (ECO)', initialWeight: '0 to 5kg', boxFee: 15, initialCharge: 90.00, ratePerKg: null, handleFee: 0 },];
// --- END OF COPIED DATA ---

interface ShippingSelectorProps {
    cartItemCount: number;
    onShippingChange: (info: { method: 'pudo' | 'paxi' | 'door' | 'international'; cost: number; details: string; }) => void;
    subtotal: number;
}

const ShippingSelector: React.FC<ShippingSelectorProps> = ({ cartItemCount, onShippingChange, subtotal }) => {
    const { user, currency } = useStore();

    const [shippingMethod, setShippingMethod] = useState<'pudo' | 'paxi' | 'door' | 'international'>('pudo');

    // Paxi Logic
    const [paxiProvince, setPaxiProvince] = useState('');
    const [paxiTown, setPaxiTown] = useState('');
    const [paxiStoreName, setPaxiStoreName] = useState('');
    const [paxiStoreAddress, setPaxiStoreAddress] = useState('');

    // Pudo Logic
    const [pudoProvince, setPudoProvince] = useState('');
    const [pudoTown, setPudoTown] = useState('');
    const [pudoLockerLocation, setPudoLockerLocation] = useState('');

    // Door to Door Logic
    const [doorService, setDoorService] = useState<'overnight' | 'economy'>('economy');
    const [doorAddress, setDoorAddress] = useState<ShippingAddress>({
        street: user.shippingAddress?.street || '',
        suburb: user.shippingAddress?.suburb || '',
        city: user.shippingAddress?.city || '',
        province: user.shippingAddress?.province || '',
        postalCode: user.shippingAddress?.postalCode || ''
    });

    // International Shipping Logic
    const [internationalAddress, setInternationalAddress] = useState<ShippingAddress>({
        street: '',
        suburb: '',
        city: '',
        province: '',
        postalCode: '',
        country: '',
        email: ''
    });

    // Dynamic Costs
    const [pudoCosts, setPudoCosts] = useState<PudoCostItem[]>(INITIAL_PUDO_COSTS);
    const [paxiCosts, setPaxiCosts] = useState<PaxiServicesState>(INITIAL_PAXI_COSTS);
    const [doorToDoorCosts, setDoorToDoorCosts] = useState<PudoDoorToDoorItem[]>(INITIAL_DOOR_TO_DOOR_COSTS);

    const isFreeShippingActive = subtotal >= 500;

    useEffect(() => {
        // If free shipping becomes active and an invalid method is selected, switch to a valid one.
        if (isFreeShippingActive && shippingMethod === 'door') {
            setShippingMethod('pudo'); // Default to PUDO
        }
    }, [isFreeShippingActive, shippingMethod]);

    useEffect(() => {
        if (currency === 'USD') {
            setShippingMethod('international');
        } else if (shippingMethod === 'international') {
            setShippingMethod('pudo');
        }
    }, [currency]);

    useEffect(() => {
        try {
          const savedPudo = localStorage.getItem('spv_pudo_costs');
          if (savedPudo) setPudoCosts(JSON.parse(savedPudo));
          
          const savedPaxi = localStorage.getItem('spv_paxi_costs');
          if (savedPaxi) setPaxiCosts(JSON.parse(savedPaxi));

          const savedDoor = localStorage.getItem('spv_door_to_door_costs');
          if (savedDoor) setDoorToDoorCosts(JSON.parse(savedDoor));

        } catch (error) {
          console.error("Failed to load shipping costs from storage", error);
        }
    }, []);

    useEffect(() => {
        let cost = 0;
        let details = '';

        if (shippingMethod === 'pudo') {
            const sizeKey = cartItemCount <= 20 ? 'Extra-Small (XS)' : 'Small (S)';
            const costData = pudoCosts.find(c => c.name === sizeKey);
            let lockerOrDoor = 'locker';
            // Determine if user selected Locker to Locker or Door to Locker (add UI logic if needed)
            // For now, default to Locker to Locker
            if (costData) {
                // If Locker to Locker selected
                if (costData.lockerToLockerCost !== null) {
                    cost = costData.boxCost + costData.lockerToLockerCost + costData.lockerHandleFee;
                } else if (costData.doorToLockerCost !== null) {
                    cost = costData.boxCost + costData.doorToLockerCost + costData.doorHandleFee;
                    lockerOrDoor = 'door';
                } else {
                    cost = costData.boxCost;
                }
            } else {
                cost = 60; // Fallback
            }
            if(pudoProvince && pudoTown && pudoLockerLocation) {
                details = `${pudoProvince} | ${pudoTown} | ${pudoLockerLocation} | ${lockerOrDoor}`;
            }
        } else if (shippingMethod === 'paxi') {
            // Support both service levels
            let selectedService = '7-9 Days Service';
            if (subtotal > 1000) selectedService = '3-5 Days Service'; // Example logic, adjust as needed
            const service = paxiCosts[selectedService];
            const bagKey = cartItemCount <= 20 ? 'Small' : 'Large';
            const costData = service.find(b => b.bag.includes(bagKey));
            let boxFee = bagKey === 'Small' ? 6 : 15;
            if (costData) {
                cost = boxFee + costData.serviceCost + costData.handleFee;
            } else {
                cost = 60; // Fallback
            }
            if(paxiProvince && paxiTown && paxiStoreName && paxiStoreAddress) {
                details = `${paxiProvince} | ${paxiTown} | ${paxiStoreName} | ${paxiStoreAddress} | ${selectedService}`;
            }
        } else if (shippingMethod === 'door') {
            const serviceIdentifier = doorService === 'overnight' ? 'Overnight' : 'Economy';
            const costData = doorToDoorCosts.find(c => c.service.includes(serviceIdentifier));
            if (costData) {
                cost = costData.boxFee + costData.initialCharge + (costData.ratePerKg !== null ? costData.ratePerKg : 0) + costData.handleFee;
            } else {
                cost = 120; // Fallback
            }
            if(doorAddress.street && doorAddress.city && doorAddress.postalCode) {
                details = JSON.stringify({...doorAddress, service: doorService });
            }
        } else if (shippingMethod === 'international') {
            cost = 60;
            if(internationalAddress.street && internationalAddress.city && internationalAddress.postalCode) {
                details = `International Shipping | ${internationalAddress.street}, ${internationalAddress.suburb ? internationalAddress.suburb + ', ' : ''}${internationalAddress.city}, ${internationalAddress.province ? internationalAddress.province + ', ' : ''}${internationalAddress.postalCode}${internationalAddress.country ? ', ' + internationalAddress.country : ''}${internationalAddress.email ? ' | Email: ' + internationalAddress.email : ''}`;
            } else {
                details = 'International Shipping';
            }
        }

        onShippingChange({ method: shippingMethod, cost, details });
    }, [
        shippingMethod, cartItemCount, pudoCosts, paxiCosts, doorToDoorCosts, doorService,
        pudoProvince, pudoTown, pudoLockerLocation,
        paxiProvince, paxiTown, paxiStoreName, paxiStoreAddress,
        doorAddress, internationalAddress,
        onShippingChange
    ]);


    useEffect(() => {
        setPudoTown('');
    }, [pudoProvince]);

    useEffect(() => {
        setPaxiTown('');
        setPaxiStoreName('');
        setPaxiStoreAddress('');
    }, [paxiProvince]);

    useEffect(() => {
        setPaxiStoreName('');
        setPaxiStoreAddress('');
    }, [paxiTown]);

    return (
        <div className="bg-zinc-900 border border-gray-800 p-6 rounded-xl">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                <Truck size={18} className="text-cyan-400" /> Shipping Method
            </h3>
            
            <div className="space-y-3">
                {currency === 'USD' ? (
                    <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === 'international' ? 'bg-green-900/20 border-green-500' : 'bg-black border-gray-700 hover:border-gray-600'}`}>
                       <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${shippingMethod === 'international' ? 'border-green-500 bg-green-500' : 'border-gray-500'}`}>
                             {shippingMethod === 'international' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                          </div>
                          <span className="text-sm text-gray-300">International Shipping $60</span>
                       </div>
                       <input type="radio" className="hidden" name="shipping" checked={shippingMethod === 'international'} onChange={() => setShippingMethod('international')} />
                    </label>
                ) : (
                    <>
                        <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === 'pudo' ? 'bg-cyan-900/20 border-cyan-500' : 'bg-black border-gray-700 hover:border-gray-600'}`}>
                           <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${shippingMethod === 'pudo' ? 'border-cyan-500 bg-cyan-500' : 'border-gray-500'}`}>
                                 {shippingMethod === 'pudo' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                              </div>
                              <span className="text-sm text-gray-300">PUDO Locker to Locker</span>
                           </div>
                           <input type="radio" className="hidden" name="shipping" checked={shippingMethod === 'pudo'} onChange={() => setShippingMethod('pudo')} />
                        </label>

                        <label className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${shippingMethod === 'paxi' ? 'bg-yellow-900/20 border-yellow-500' : 'bg-black border-gray-700 hover:border-gray-600'}`}>
                           <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${shippingMethod === 'paxi' ? 'border-yellow-500 bg-yellow-500' : 'border-gray-500'}`}>
                                 {shippingMethod === 'paxi' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                              </div>
                              <span className="text-sm text-gray-300">PAXI (PEP Store - 7-9 Days)</span>
                           </div>
                           <input type="radio" className="hidden" name="shipping" checked={shippingMethod === 'paxi'} onChange={() => setShippingMethod('paxi')} />
                        </label>

                        <label className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            shippingMethod === 'door'
                                ? 'bg-purple-900/20 border-purple-500 cursor-pointer'
                                : isFreeShippingActive
                                    ? 'bg-zinc-900 border-gray-800 opacity-50 cursor-not-allowed'
                                    : 'bg-black border-gray-700 hover:border-gray-600 cursor-pointer'
                        }`}>
                           <div className="flex items-center gap-3">
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                                  shippingMethod === 'door'
                                      ? 'border-purple-500 bg-purple-500'
                                      : isFreeShippingActive
                                          ? 'border-gray-700'
                                          : 'border-gray-500'
                              }`}>
                                 {shippingMethod === 'door' && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                              </div>
                              <div>
                                  <span className={`text-sm ${isFreeShippingActive ? 'text-gray-500' : 'text-gray-300'}`}>
                                      PUDO Door to Door
                                  </span>
                                  {isFreeShippingActive && <span className="text-xs text-gray-500 block">Not available for free shipping</span>}
                              </div>
                           </div>
                           <input
                              type="radio"
                              className="hidden"
                              name="shipping"
                              checked={shippingMethod === 'door'}
                              onChange={() => setShippingMethod('door')}
                              disabled={isFreeShippingActive}
                           />
                        </label>
                    </>
                )}
            </div>

            {/* Dynamic Inputs based on Method */}
            {shippingMethod === 'pudo' && (
                 <div className="mt-3 animate-in slide-in-from-top-2 relative space-y-3 p-3 bg-zinc-800/30 rounded border border-cyan-500/20">
                     <div className="flex justify-between items-center mb-1">
                         <label className="text-[10px] text-cyan-400 uppercase font-bold">Select PUDO Locker Location</label>
                         <a href="https://thecourierguy.co.za/locations/" target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1">
                             <MapPin size={10} /> Find PUDO Locker Location Click Here
                         </a>
                     </div>
                     
                     <div>
                         <label className="block text-[9px] text-gray-500 uppercase mb-1">Step 1: Province</label>
                         <div className="relative">
                             <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs focus:border-cyan-500 outline-none appearance-none" value={pudoProvince} onChange={e => setPudoProvince(e.target.value)} >
                                 <option value="">-- Select Province --</option>
                                 {Object.keys(PAXI_LOCATIONS).sort().map(prov => (<option key={prov} value={prov}>{prov}</option>))}
                             </select>
                             <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                         </div>
                     </div>

                     {pudoProvince && (
                         <div className="animate-in fade-in slide-in-from-top-1">
                             <label className="block text-[9px] text-gray-500 uppercase mb-1">Step 2: City / Town</label>
                             <div className="relative">
                                 <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs focus:border-cyan-500 outline-none appearance-none" value={pudoTown} onChange={e => setPudoTown(e.target.value)}>
                                     <option value="">-- Select Town --</option>
                                     {Object.keys(PAXI_LOCATIONS[pudoProvince] || {}).sort().map(town => (<option key={town} value={town}>{town}</option>))}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                             </div>
                         </div>
                     )}

                     {pudoTown && (
                         <div className="animate-in fade-in slide-in-from-top-1 space-y-2">
                             <div>
                                 <label className="block text-[9px] text-gray-500 uppercase mb-1">Step 3: Locker Name / Address</label>
                                 <input type="text" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs focus:border-cyan-500 outline-none" placeholder="e.g. PUDO Locker @ Sandton City" value={pudoLockerLocation} onChange={e => setPudoLockerLocation(e.target.value)} />
                             </div>
                         </div>
                     )}
                 </div>
            )}
             
            {shippingMethod === 'paxi' && (
                 <div className="mt-3 animate-in slide-in-from-top-2 relative space-y-3 p-3 bg-zinc-800/30 rounded border border-yellow-500/20">
                     <div className="flex justify-between items-center mb-1">
                         <label className="text-[10px] text-yellow-400 uppercase font-bold">Select PEP Store</label>
                         <a href="https://www.paxi.co.za/paxi-points" target="_blank" rel="noreferrer" className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1">
                             <MapPin size={10} /> Find PAXI Point
                         </a>
                     </div>
                     
                     <div>
                         <label className="block text-[9px] text-gray-500 uppercase mb-1">Step 1: Province</label>
                         <div className="relative">
                             <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs focus:border-yellow-500 outline-none appearance-none" value={paxiProvince} onChange={e => setPaxiProvince(e.target.value)}>
                                 <option value="">-- Select Province --</option>
                                 {Object.keys(PAXI_LOCATIONS).sort().map(prov => (<option key={prov} value={prov}>{prov}</option>))}
                             </select>
                             <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                         </div>
                     </div>

                     {paxiProvince && (
                         <div className="animate-in fade-in slide-in-from-top-1">
                             <label className="block text-[9px] text-gray-500 uppercase mb-1">Step 2: City / Town</label>
                             <div className="relative">
                                 <select className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs focus:border-yellow-500 outline-none appearance-none" value={paxiTown} onChange={e => setPaxiTown(e.target.value)}>
                                     <option value="">-- Select Town --</option>
                                     {Object.keys(PAXI_LOCATIONS[paxiProvince] || {}).sort().map(town => (<option key={town} value={town}>{town}</option>))}
                                 </select>
                                 <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                             </div>
                         </div>
                     )}

                     {paxiTown && (
                         <div className="animate-in fade-in slide-in-from-top-1 space-y-2">
                             <div>
                                 <label className="block text-[9px] text-gray-500 uppercase mb-1">Step 3: Store Name (or P-Code)</label>
                                 <input type="text" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs focus:border-yellow-500 outline-none" placeholder="e.g. PEP Home Acornhoek Mall" value={paxiStoreName} onChange={e => setPaxiStoreName(e.target.value)} />
                             </div>
                             <div>
                                 <label className="block text-[9px] text-gray-500 uppercase mb-1">Store Street Address</label>
                                 <input type="text" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs focus:border-yellow-500 outline-none" placeholder="e.g. Shop 27, Acornhoek Mall, R40 Main Rd" value={paxiStoreAddress} onChange={e => setPaxiStoreAddress(e.target.value)} />
                             </div>
                         </div>
                     )}
                 </div>
            )}

            {shippingMethod === 'door' && (
                 <div className="mt-3 animate-in slide-in-from-top-2 space-y-3 p-3 bg-zinc-800/30 rounded border border-purple-500/20">
                     <label className="text-[10px] text-purple-400 uppercase font-bold block">Select Service</label>
                     <div className="flex gap-2">
                         <label className={`flex-1 flex items-center gap-2 p-2 rounded border cursor-pointer text-xs ${doorService === 'economy' ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-black border-gray-700 text-gray-400'}`}>
                            <input type="radio" name="doorService" value="economy" checked={doorService === 'economy'} onChange={() => setDoorService('economy')} className="hidden" />
                            Economy Road
                         </label>
                         <label className={`flex-1 flex items-center gap-2 p-2 rounded border cursor-pointer text-xs ${doorService === 'overnight' ? 'bg-purple-900/30 border-purple-500 text-white' : 'bg-black border-gray-700 text-gray-400'}`}>
                             <input type="radio" name="doorService" value="overnight" checked={doorService === 'overnight'} onChange={() => setDoorService('overnight')} className="hidden" />
                             Overnight Courier
                         </label>
                     </div>

                     <label className="text-[10px] text-purple-400 uppercase font-bold block pt-2 border-t border-gray-700/50">Delivery Address</label>
                     <input type="text" placeholder="Street Address" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs" 
                        value={doorAddress.street} onChange={e => setDoorAddress({...doorAddress, street: e.target.value})} />
                     <input type="text" placeholder="Suburb" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs" 
                        value={doorAddress.suburb} onChange={e => setDoorAddress({...doorAddress, suburb: e.target.value})} />
                     <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="City" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs" 
                            value={doorAddress.city} onChange={e => setDoorAddress({...doorAddress, city: e.target.value})} />
                        <input type="text" placeholder="Postal Code" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs" 
                            value={doorAddress.postalCode} onChange={e => setDoorAddress({...doorAddress, postalCode: e.target.value})} />
                     </div>
                     <input type="text" placeholder="Province" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs" 
                        value={doorAddress.province} onChange={e => setDoorAddress({...doorAddress, province: e.target.value})} />
                 </div>
            )}

            {shippingMethod === 'international' && (
                 <div className="mt-3 animate-in slide-in-from-top-2 space-y-3 p-3 bg-zinc-800/30 rounded border border-green-500/20">
                     <label className="text-[10px] text-green-400 uppercase font-bold block">International Shipping Address</label>
                     <input type="text" placeholder="Street Address" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs"
                        value={internationalAddress.street} onChange={e => setInternationalAddress({...internationalAddress, street: e.target.value})} />
                     <input type="text" placeholder="Suburb" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs"
                        value={internationalAddress.suburb} onChange={e => setInternationalAddress({...internationalAddress, suburb: e.target.value})} />
                     <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="City" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs"
                            value={internationalAddress.city} onChange={e => setInternationalAddress({...internationalAddress, city: e.target.value})} />
                        <input type="text" placeholder="Postal Code" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs"
                            value={internationalAddress.postalCode} onChange={e => setInternationalAddress({...internationalAddress, postalCode: e.target.value})} />
                     </div>
                     <input type="text" placeholder="Province" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs"
                        value={internationalAddress.province} onChange={e => setInternationalAddress({...internationalAddress, province: e.target.value})} />
                     <input type="text" placeholder="Country" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs"
                        value={internationalAddress.country || ''} onChange={e => setInternationalAddress({...internationalAddress, country: e.target.value})} />
                     <input type="email" placeholder="Email" className="w-full bg-black border border-gray-700 rounded p-2 text-white text-xs"
                        value={internationalAddress.email || ''} onChange={e => setInternationalAddress({...internationalAddress, email: e.target.value})} />
                     <p className="text-xs text-yellow-400 mt-2">You are liable for any import taxes if any arises.</p>
                 </div>
            )}
        </div>
    );
};

export default ShippingSelector;
