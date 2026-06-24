import { useState, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useColors, typography, spacing } from "../../tokens";
import { MuscleProgress } from "../../utils/muscleXp";
import { GlossyOverlay } from "./GlossyOverlay";

interface BodySilhouetteProps {
  muscleData: MuscleProgress[];
  selectedMuscle: string | null;
  onSelectMuscle: (zone: string) => void;
}

// ─────────────────────────────────────────────────────
// SVG path data from body-muscles (Apache 2.0 licensed)
// https://github.com/vulovix/body-muscles
// ViewBox: front = "0 0 35 93", back = "37 0 35 93"
// ─────────────────────────────────────────────────────

type ViewSide = "front" | "back";

interface MusclePathDef {
  id: string;
  zone: string; // our zone key
  d: string;
}

// Front view muscle paths mapped to our zones
const FRONT_MUSCLES: MusclePathDef[] = [
  // ── CHEST ──
  {
    id: "chest-upper-left",
    zone: "chest",
    d: "m 20.337455,17.085495 1.72942,3.09103 1.890,0.94 -0.5,0.3 -6.8, -2.1 z",
  },
  {
    id: "chest-lower-left",
    zone: "chest",
    d: "m 16.66,19.72 6.8,2.1 -0.65,0.5 -0.90604,2.63773 -2.09968,0.86537 -3.34524,-1.655 0.2,-3.8 z",
  },
  {
    id: "chest-upper-right",
    zone: "chest",
    d: "m 11.351215,17.085495 -1.7294199,3.09103 -1.890,0.94 0.5,0.3 6.8,-2.1 z",
  },
  {
    id: "chest-lower-right",
    zone: "chest",
    d: "m 15.03,19.72 -6.8,2.1 0.65,0.5 0.90586,2.63773 2.0996699,0.86537 3.34636,-1.655 -0.2,-3.8 z",
  },

  // ── SHOULDERS ──
  {
    id: "shoulder-front-left",
    zone: "shoulders",
    d: "m 19.047795,13.248365 3.55748,1.97916 0.72653,-0.35074 z m -0.107,0.43288 -0.37119,1.73073 2.1846,0.53561 1.40116,-0.49436 z",
  },
  {
    id: "shoulder-side-left",
    zone: "shoulders",
    d: "m 22.922305,15.657195 0.75814,-0.41 2.40806,1.66799 1.17364,1.50707 0.62662,1.5626 -0.0464,3.70194 -1.3284,-1.72153 0.0407,-2.59376 -0.48842,-0.50049 c 0,0 -3.09778,-3.19058 -3.14371,-3.21401 z m -0.2409,0.10873 c -0.001,0.0525 3.32987,3.54733 3.32987,3.54733 l 0.10067,3.10396 -1.15426,-1.97782 -2.22547,-0.94804 -1.56576,-2.88481 z",
  },
  {
    id: "shoulder-front-right",
    zone: "shoulders",
    d: "m 12.624785,13.248365 -3.5574599,1.97916 -0.72653,-0.35074 z m 0.107,0.43288 0.37119,1.73073 -2.18459,0.53561 -1.4011499,-0.49436 z",
  },
  {
    id: "shoulder-side-right",
    zone: "shoulders",
    d: "m 8.7502951,15.657195 -0.75814,-0.41 -2.40806,1.66799 -1.17364,1.50707 -0.62662,1.56259 0.0464,3.70195 1.3284,-1.72153 -0.0407,-2.59376 0.48843,-0.5005 c 0,0 3.09777,-3.19057 3.1437,-3.214 z m 0.2409,0.10873 c 0.002,0.0525 -3.32987,3.54733 -3.32987,3.54733 l -0.10067,3.10396 1.15426,-1.97782 2.22547,-0.94804 1.5657499,-2.88481 z",
  },

  // ── BICEPS ──
  {
    id: "biceps-left",
    zone: "biceps",
    d: "m 27.621665,30.814715 -0.33838,1.70499 -1.81932,-2.54418 -0.6629,-1.26895 z m -2.85271,-2.6096 c -0.0259,-0.0144 -0.0536,-0.0254 -0.0824,-0.0324 l -1.48333,-4.95503 1.00456,-2.08428 1.65511,1.74532 2.23034,6.67667 0.0415,0.93739 c -1.06528,-0.84215 -2.18962,-1.60679 -3.36434,-2.28803 z m 1.6945,-5.75654 1.64893,6.43421 -0.36469,-4.92266 z",
  },
  {
    id: "biceps-right",
    zone: "biceps",
    d: "m 4.0746451,30.814715 0.33838,1.70499 1.81931,-2.54418 0.66289,-1.26895 z m 2.8527,-2.6096 c 0.0259,-0.0144 0.0536,-0.0254 0.0824,-0.0324 l 1.48332,-4.95503 -1.00455,-2.08428 -1.65509,1.74532 -2.23034,6.67667 -0.0415,0.93739 c 1.06528,-0.84215 2.18961,-1.60679 3.36433,-2.28803 z m -1.6945,-5.75654 -1.64891,6.43421 0.36468,-4.92266 z",
  },

  // ── FOREARMS ──
  {
    id: "forearm-left",
    zone: "forearms",
    d: "m 26.955425,32.969125 1.30083,10.28927 -1.10778,0.01 -1.89387,-7.99609 0.19174,-4.53719 z m 1.21978,-1.94971 -0.58729,2.58635 1.11876,9.15614 0.55849,-0.21663 0.2304,-6.77018 z",
  },
  {
    id: "forearm-right",
    zone: "forearms",
    d: "m 4.5752651,32.969125 -1.30083,10.28927 1.10778,0.01 1.89387,-7.99609 -0.19174,-4.53719 z m -1.21978,-1.94971 0.58728,2.58635 -1.11875,9.15614 -0.55849,-0.21663 -0.2304,-6.77018 z",
  },

  // ── CORE (abs) ──
  {
    id: "abs-upper-left",
    zone: "core",
    d: "m 19.641935,34.707615 1.81341,-1.36479 0.15748,1.83347 1.28642,2.37338 -1.98044,2.73652 -1.03109,0.16554 -0.37026,-3.88816 z",
  },
  {
    id: "abs-upper-right",
    zone: "core",
    d: "m 12.045985,34.707615 -1.81341,-1.36479 -0.15748,1.83347 -1.2856799,2.37432 1.9804499,2.73595 1.03109,0.16554 0.37119,-3.88721 z",
  },
  {
    id: "abs-lower-left",
    zone: "core",
    d: "m 16.051865,44.919165 0.60628,-5.91209 0.0154,-3.84915 2.18404,-1.07515 0.24746,7.03017 z",
  },
  {
    id: "abs-lower-right",
    zone: "core",
    d: "m 15.636055,44.919735 -0.60647,-5.91209 -0.015,-3.84879 -2.18479,-1.07533 -0.24746,7.03017 z",
  },

  // ── OBLIQUES ──
  {
    id: "obliques-left",
    zone: "obliques",
    d: "M 18.791,29.025 l -0.0622 1.62387 -2.30308 -0.49961 -0.12448 -2.21722 z M 18.635,31.429 l 0.0311 1.99844 -2.20953 0.59391 -0.0311 -3.1227 z M 21.290,30.444 l -1.48383 1.03372 -0.20622 2.10905 1.64862 -1.32355 z",
  },
  {
    id: "obliques-right",
    zone: "obliques",
    d: "M 12.897,29.025 l 0.0623 1.62387 2.30327 -0.49961 0.12448 -2.21703 z M 13.053,31.430 l -0.0309 1.99844 2.20973 0.59353 0.0311 -3.1227 z M 10.398,30.445 l 1.48384 1.0339 0.20622 2.10905 -1.64975 -1.32355 z",
  },

  // ── QUADS ──
  {
    id: "quads-left",
    zone: "quadriceps",
    d: "m 23.419015,50.399125 -0.15504,4.75091 -2.40263,6.60949 0.7362,1.90021 2.36401,-8.34435 z m -0.58154,-11.60825 -0.15485,4.00722 1.31793,7.93154 0.61977,-6.40308 z m -0.38731,5.12268 -2.75152,6.07258 -0.62015,4.87425 1.16232,6.85771 2.51886,-6.98144 0.15504,-7.18764 z",
  },
  {
    id: "quads-right",
    zone: "quadriceps",
    d: "m 8.2694651,50.399125 0.15504,4.75053 2.4026299,6.60968 -0.73638,1.90021 -2.3640099,-8.34435 z m 0.58117,-11.60768 0.15503,4.00684 -1.31754,7.93154 -0.61978,-6.40308 z m 0.38769,5.1223 2.7515099,6.07239 0.61997,4.87425 -1.16232,6.85771 -2.5190499,-6.98163 -0.15504,-7.18801 z",
  },

  // ── ADDUCTORS (part of our quad mapping) ──
  {
    id: "adductors-left",
    zone: "quadriceps",
    d: "m 22.063225,39.369605 v 4.21363 l -2.94574,5.82511 -1.86027,5.78349 0.19365,-4.0072 z m -3.24944,13.42596 -0.0649,0.15467 -1.21294,2.90207 0.78325,7.18803 1.23619,-0.66122 -1.0714,-6.69272 z",
  },
  {
    id: "adductors-right",
    zone: "quadriceps",
    d: "m 9.6258251,39.369415 v 4.21363 l 2.9451699,5.8253 1.86028,5.78349 -0.19366,-4.0072 z m 3.2488699,13.42559 0.0647,0.15485 1.21294,2.90207 -0.78307,7.18803 -1.23618,-0.66102 1.0714,-6.69273 z",
  },

  // ── SERRATUS ANTERIOR (part of oblique/core area) ──
  {
    id: "serratus-anterior-left",
    zone: "core",
    d: "M 19.289,26.152 l -3.11202 -1.40604 0.0937 2.27965 2.80119 1.43603 z M 21.224,27.820 l -1.29355 0.7212 0.14997 -1.70898 z M 20.171,26.183 l 2.47968 -1.03241 -0.9336 2.52093 z M 21.702,27.921 l -1.69005 1.03372 -0.28871 2.0678 1.64975 -1.07533 z",
  },
  {
    id: "serratus-anterior-right",
    zone: "core",
    d: "m 12.399365,26.152365 3.11202,-1.40603 -0.0937,2.27965 -2.80138,1.4364 z m -1.93508,1.6685 1.29355,0.72139 -0.14997,-1.70899 z m 1.05303,-1.637 -2.4793099,-1.03259 0.93361,2.52148 z m -1.5316399,1.73729 1.6900499,1.03372 0.28871,2.06743 -1.64881,-1.07515 z",
  },

  // ── KNEES ──
  {
    id: "knee-left",
    zone: "quadriceps",
    d: "m 21.404635,64.784375 0.1243,1.12295 -0.87118,1.08171 -0.29058,1.70599 -0.58116,0.24933 -0.49774,-2.57866 -0.33182,-0.91486 0.29058,-0.58247 z m -3.85853,0.0832 0.6224,1.74685 1.3273,2.57867 -0.33182,2.37095 -0.95423,-2.66209 -0.78738,-1.49734 z m 4.97811,-2.37039 -0.95423,5.11609 0.62241,-0.33295 0.49773,1.66381 z",
  },
  {
    id: "knee-right",
    zone: "quadriceps",
    d: "m 10.284405,64.784375 -0.12448,1.12295 0.87118,1.08171 0.29058,1.70599 0.58116,0.24933 0.49774,-2.57866 0.33182,-0.91486 -0.29058,-0.58247 z m 3.85854,0.0832 -0.62241,1.74685 -1.32767,2.57867 0.33182,2.37095 0.95423,-2.66209 0.78832,-1.4964 z m -4.9786799,-2.37058 0.9542299,5.11609 -0.6223999,-0.33313 -0.49793,1.6638 z",
  },

  // ── TIBIALIS ANTERIOR ──
  {
    id: "tibialis-anterior-left",
    zone: "calves",
    d: "m 18.251375,70.441125 0.29058,0.91486 0.6224,3.8681 0.0829,5.15733 -0.87136,5.03304 0.0412,-6.44714 -0.91242,-2.57848 -0.12561,-2.82837 z m 1.9915,2.32915 -0.20753,7.73637 -1.65949,6.23904 1.80478,-0.853 3.00816,-10.83583 -1.03727,-6.82095 z",
  },
  {
    id: "tibialis-anterior-right",
    zone: "calves",
    d: "m 13.437675,70.440945 -0.29058,0.91486 -0.62241,3.86828 -0.0829,5.15733 0.87174,5.03304 -0.0418,-6.44714 0.91298,-2.57848 0.1243,-2.82837 z m -1.99151,2.32914 0.20735,7.73637 1.65968,6.23904 -1.80497,-0.85299 -3.0079799,-10.83584 1.03728,-6.82095 z",
  },

  // Rotator cuff markers (deep shoulder capsule, small circle at glenohumeral joint)
  {
    id: "rotator-cuff-left",
    zone: "rotator_cuff",
    d: "M 25.0,16.0 A 1.0 1.0 0 1 1 25.0,18.0 A 1.0 1.0 0 1 1 25.0,16.0 Z",
  },
  {
    id: "rotator-cuff-right",
    zone: "rotator_cuff",
    d: "M 10.0,16.0 A 1.0 1.0 0 1 1 10.0,18.0 A 1.0 1.0 0 1 1 10.0,16.0 Z",
  },
];

// Back view muscle paths mapped to our zones
const BACK_MUSCLES: MusclePathDef[] = [
  // ── TRAPS ──
  {
    id: "traps-upper-left",
    zone: "traps",
    d: "M 49.625,14.629 L 49.688,12.005 L 48.974,13.157 L 44.594,14.654 L 45.945,16.925 L 51.222,16.925 L 51.183,14.550 Z",
  },
  {
    id: "traps-mid-left",
    zone: "traps",
    d: "M 46.034,17.075 L 48.920,21.925 L 51.303,21.925 L 51.224,17.075 Z",
  },
  {
    id: "traps-lower-left",
    zone: "traps",
    d: "M 49.009,22.075 L 49.572,23.022 L 51.403,28.104 L 51.305,22.075 Z",
  },
  {
    id: "traps-upper-right",
    zone: "traps",
    d: "M 55.439,14.729 L 55.376,12.104 L 56.090,13.256 L 60.470,14.754 L 59.179,16.925 L 53.844,16.925 L 53.881,14.649 Z",
  },
  {
    id: "traps-mid-right",
    zone: "traps",
    d: "M 59.089,17.075 L 56.204,21.925 L 53.763,21.925 L 53.842,17.075 Z",
  },
  {
    id: "traps-lower-right",
    zone: "traps",
    d: "M 56.114,22.075 L 55.492,23.121 L 53.661,28.203 L 53.761,22.075 Z",
  },

  // ── LATS ──
  {
    id: "lats-upper-left",
    zone: "lats",
    d: "M 44.144,15.285 L 39.888,20.286 L 39.426,22.749 L 41.263,21.510 L 44.025,20.355 L 45.663,23.400 L 49.103,23.400 Z",
  },
  {
    id: "lats-mid-left",
    zone: "lats",
    d: "M 45.771,23.600 L 45.872,23.789 L 47.009,29.286 L 47.023,30.400 L 51.080,30.400 L 51.053,28.314 L 49.185,23.600 Z",
  },
  {
    id: "lats-lower-left",
    zone: "lats",
    d: "M 47.026,30.600 L 47.086,35.145 L 51.156,36.255 L 51.082,30.600 Z",
  },
  {
    id: "lats-upper-right",
    zone: "lats",
    d: "M 60.921,15.384 L 65.176,20.385 L 65.290,22.849 L 63.801,21.609 L 61.039,20.454 L 59.455,23.400 L 56.022,23.400 Z",
  },
  {
    id: "lats-mid-right",
    zone: "lats",
    d: "M 59.347,23.600 L 59.192,23.888 L 58.055,29.385 L 58.042,30.400 L 53.986,30.400 L 54.012,28.413 L 55.918,23.600 Z",
  },
  {
    id: "lats-lower-right",
    zone: "lats",
    d: "M 58.039,30.600 L 57.979,35.245 L 53.908,36.354 L 53.983,30.600 Z",
  },

  // ── TRICEPS ──
  {
    id: "triceps-long-left",
    zone: "triceps",
    d: "M 43.593,21.039 L 44.920,23.967 L 43.615,25.653 L 43.186,27.069 L 39.209,29.802 Z",
  },
  {
    id: "triceps-lateral-left",
    zone: "triceps",
    d: "M 43.459,20.972 L 39.075,29.735 L 38.871,25.461 L 39.407,23.674 L 41.242,21.927 Z",
  },
  {
    id: "triceps-long-right",
    zone: "triceps",
    d: "M 61.376,21.213 L 60.056,24.145 L 61.330,26.199 L 61.657,27.251 L 65.780,29.966 Z",
  },
  {
    id: "triceps-lateral-right",
    zone: "triceps",
    d: "M 61.510,21.146 L 65.914,29.899 L 66.108,25.624 L 65.568,23.839 L 63.729,22.096 Z",
  },

  // ── REAR DELTOIDS (part of shoulders) ──
  {
    id: "deltoid-rear-left",
    zone: "shoulders",
    d: "M 42.201,16.586 L 40.626,18.152 L 39.736,20.156 L 43.992,15.155 Z",
  },
  {
    id: "deltoid-rear-right",
    zone: "shoulders",
    d: "M 62.863,16.686 L 64.438,18.251 L 65.328,20.255 L 61.073,15.254 Z",
  },

  // ── LOWER BACK (erectors + QL) ──
  {
    id: "lower-back-erectors-left",
    zone: "lower_back",
    d: "M 52.100,37.310 L 49.537,36.465 L 50.244,40.788 L 52.200,42.030 L 52.200,40.270 L 52.150,40.280 Z",
  },
  {
    id: "lower-back-ql-left",
    zone: "lower_back",
    d: "M 49.389,36.490 L 46.240,35.460 L 44.720,39.420 L 50.096,40.812 Z",
  },
  {
    id: "lower-back-erectors-right",
    zone: "lower_back",
    d: "M 52.800,42.030 L 52.800,40.270 L 52.850,40.260 L 52.900,37.290 L 55.289,36.625 L 54.805,40.801 Z",
  },
  {
    id: "lower-back-ql-right",
    zone: "lower_back",
    d: "M 55.439,36.643 L 55.980,36.470 L 58.320,35.720 L 59.660,39.450 L 54.955,40.819 Z",
  },

  // ── SPINE ──
  {
    id: "spine",
    zone: "lower_back",
    d: "m 51.733705,14.788555 0.53876,25.33066 0.48967,-0.0297 0.65658,-25.3387 -0.28147,-0.84188 -1.25059,-4.9e-4 z",
  },

  // ── GLUTES ──
  {
    id: "gluteus-medius-left",
    zone: "glutes",
    d: "M 50.191,41.481 L 44.740,39.690 L 43.830,41.580 L 43.431,44.301 Z",
  },
  {
    id: "gluteus-maximus-left",
    zone: "glutes",
    d: "M 50.249,41.619 L 43.489,44.439 L 44.410,50.520 L 47.180,51.030 L 51.620,49.090 L 52.200,49.480 L 52.200,42.880 Z",
  },
  {
    id: "gluteus-medius-right",
    zone: "glutes",
    d: "M 55.274,41.079 L 61.354,45.519 L 60.640,42.150 L 59.740,39.860 Z",
  },
  {
    id: "gluteus-maximus-right",
    zone: "glutes",
    d: "M 55.186,41.201 L 52.800,42.880 L 52.800,49.480 L 53.570,49.090 L 57.680,50.760 L 60.500,50.600 L 61.266,45.641 Z",
  },

  // ── HAMSTRINGS ──
  {
    id: "hamstrings-medial-left",
    zone: "hamstrings",
    d: "M 49.550,50.504 L 51.751,49.461 L 52.389,49.692 L 52.424,51.499 L 52.499,56.145 L 50.521,62.188 L 50.997,63.602 L 49.569,66.897 L 48.755,66.754 Z",
  },
  {
    id: "hamstrings-lateral-left",
    zone: "hamstrings",
    d: "M 49.400,50.496 L 48.605,66.746 L 47.803,66.596 L 47.302,64.480 L 47.133,62.723 L 44.712,54.565 L 44.369,50.918 L 47.200,51.500 Z",
  },
  {
    id: "hamstrings-medial-right",
    zone: "hamstrings",
    d: "M 57.425,51.196 L 56.565,66.806 L 55.759,66.965 L 54.331,63.670 L 54.807,62.256 L 52.829,56.213 L 52.904,51.567 L 52.956,49.769 L 53.520,49.498 Z",
  },
  {
    id: "hamstrings-lateral-right",
    zone: "hamstrings",
    d: "M 57.575,51.204 L 60.625,50.950 L 60.616,54.633 L 58.195,62.791 L 58.026,64.547 L 57.525,66.663 L 56.715,66.814 Z",
  },

  // ── CALVES (back view) ──
  {
    id: "calves-gastroc-medial-left",
    zone: "calves",
    d: "M 50.568,67.512 L 51.669,72.509 L 51.379,75.532 L 51.292,76.825 L 48.983,76.825 Z",
  },
  {
    id: "calves-gastroc-lateral-left",
    zone: "calves",
    d: "M 50.218,67.512 L 48.633,76.825 L 46.283,76.825 L 45.533,74.263 L 46.783,67.088 Z",
  },
  {
    id: "calves-soleus-left",
    zone: "calves",
    d: "M 46.386,77.175 L 51.269,77.175 L 50.701,85.598 L 49.037,86.233 Z",
  },
  {
    id: "calves-gastroc-medial-right",
    zone: "calves",
    d: "M 54.628,67.512 L 53.526,72.509 L 53.816,75.532 L 53.903,76.825 L 56.213,76.825 Z",
  },
  {
    id: "calves-gastroc-lateral-right",
    zone: "calves",
    d: "M 54.978,67.512 L 56.563,76.825 L 58.912,76.825 L 59.662,74.263 L 58.412,67.088 Z",
  },
  {
    id: "calves-soleus-right",
    zone: "calves",
    d: "M 53.927,77.175 L 58.810,77.175 L 56.158,86.233 L 54.495,85.598 Z",
  },

  // Rotator cuff markers (deep, small accent near glenohumeral joint)
  {
    id: "rotator-cuff-left",
    zone: "rotator_cuff",
    d: "M 44.5,16.0 A 1.0 1.0 0 1 1 44.5,18.0 A 1.0 1.0 0 1 1 44.5,16.0 Z",
  },
  {
    id: "rotator-cuff-right",
    zone: "rotator_cuff",
    d: "M 58.5,16.0 A 1.0 1.0 0 1 1 58.5,18.0 A 1.0 1.0 0 1 1 58.5,16.0 Z",
  },

  // ── FOREARMS (back) ──
  {
    id: "forearm-flexors-left",
    zone: "forearms",
    d: "M 40.775,29.006 L 42.870,27.644 L 42.187,29.635 L 42.603,34.383 L 40.799,42.081 L 39.814,42.253 Z",
  },
  {
    id: "forearm-extensors-left",
    zone: "forearms",
    d: "M 39.665,42.242 L 38.305,41.501 L 37.998,34.491 L 38.635,31.429 L 39.245,30.209 L 40.625,28.994 Z",
  },
  {
    id: "forearm-flexors-right",
    zone: "forearms",
    d: "M 65.204,42.420 L 63.925,29.007 L 61.764,27.798 L 62.786,29.733 L 62.397,34.555 L 64.219,42.248 Z",
  },
  {
    id: "forearm-extensors-right",
    zone: "forearms",
    d: "M 64.075,28.993 L 65.353,42.405 L 66.712,41.663 L 67.002,34.653 L 66.358,31.591 L 65.745,30.373 Z",
  },

  // ── KNEES (back) ──
  {
    id: "knee-back-left",
    zone: "hamstrings",
    d: "m 51.176145,64.073985 -1.20605,3.01461 0.70738,0.26558 0.89754,3.51771 -0.55801,-4.01191 z m -5.08496,-3.15003 0.63355,1.8609 0.16813,2.03261 0.61314,1.93117 -0.90585,-0.0851 -0.28534,2.15982 z",
  },
  {
    id: "knee-back-right",
    zone: "hamstrings",
    d: "m 54.019305,64.073985 1.20605,3.01461 -0.70737,0.26558 -0.89755,3.51771 0.55802,-4.01191 z m 5.08496,-3.15003 -0.63355,1.8609 -0.16813,2.03261 -0.61313,1.93117 0.90584,-0.0851 0.28534,2.15982 z",
  },
];

// Every zone that has a back view needs a front view entry for the legend to work.
// Zones that appear only on one side get an outline-only placeholder on the other.
const ALL_ZONES = [
  "chest",
  "shoulders",
  "biceps",
  "forearms",
  "core",
  "obliques",
  "quadriceps",
  "hamstrings",
  "calves",
  "traps",
  "lats",
  "triceps",
  "glutes",
  "lower_back",
  "rotator_cuff",
];

const ZONE_LABELS: Record<string, string> = {
  chest: "Chest",
  shoulders: "Shoulders",
  biceps: "Biceps",
  forearms: "Forearms",
  core: "Core",
  obliques: "Obliques",
  quadriceps: "Quads",
  hamstrings: "Hamstrings",
  calves: "Calves",
  traps: "Traps",
  lats: "Lats",
  triceps: "Triceps",
  glutes: "Glutes",
  lower_back: "Lower Back",
  rotator_cuff: "Rotator Cuff",
};

// ── Colour helpers ──────────────────────────────

function getMuscleStyle(muscle: MuscleProgress | undefined, colors: ReturnType<typeof useColors>) {
  if (!muscle || muscle.level === 0) {
    return { color: colors.bg.highlight, opacity: 0.2 };
  }
  if (muscle.level >= 3) {
    const intensity = 0.55 + Math.min(muscle.level * 0.08, 0.35);
    return { color: colors.success, opacity: intensity };
  }
  const intensity = 0.45 + muscle.level * 0.2;
  return { color: colors.accent.DEFAULT, opacity: Math.min(intensity, 0.9) };
}

// ── Component ──────────────────────────────────

export function BodySilhouette({
  muscleData,
  selectedMuscle,
  onSelectMuscle,
}: BodySilhouetteProps) {
  const colors = useColors();
  const [viewSide, setViewSide] = useState<ViewSide>("front");

  const muscleMap = useMemo(() => {
    const map = new Map<string, MuscleProgress>();
    for (const m of muscleData) {
      map.set(m.zone, m);
    }
    return map;
  }, [muscleData]);

  const activeMuscles = useMemo(
    () => (viewSide === "front" ? FRONT_MUSCLES : BACK_MUSCLES),
    [viewSide],
  );

  const viewBox = viewSide === "front" ? "0 0 35 93" : "37 0 35 93";

  return (
    <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: spacing.sm }}>
      {/* View toggle */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.bg.highlight,
          borderRadius: 4,
          padding: 2,
          marginBottom: spacing.sm,
          width: 140,
          overflow: "hidden",
        }}
      >
        <GlossyOverlay highlightOpacity={0.08} showReflection={false} borderRadius={4} />
        {(["front", "back"] as const).map((side) => (
          <TouchableOpacity
            key={side}
            onPress={() => setViewSide(side)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 3,
              alignItems: "center",
              backgroundColor: viewSide === side ? colors.bg.elevated : "transparent",
              borderRadius: 1,
            }}
          >
            <Text
              style={{
                ...typography.bodySmall,
                color: viewSide === side ? colors.text.primary : colors.text.secondary,
                fontSize: 7,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {side === "front" ? "Front" : "Back"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Svg width={200} height={530} viewBox={viewBox}>
        {/* Background silhouette — faint body outline */}
        {activeMuscles.map((m) => (
          <Path key={`bg-${m.id}`} d={m.d} fill={colors.bg.highlight} fillOpacity={0.35} />
        ))}

        {/* Interactive muscle paths */}
        {activeMuscles.map((m) => {
          const muscle = muscleMap.get(m.zone);
          const { color: fillColor, opacity } = getMuscleStyle(muscle, colors);
          const isSelected = selectedMuscle === m.zone;
          const hasData = muscle && muscle.level > 0;

          return (
            <Path
              key={m.id}
              d={m.d}
              fill={isSelected ? fillColor : hasData ? fillColor : "transparent"}
              fillOpacity={isSelected ? 0.65 : hasData ? opacity * 0.55 : 0}
              stroke={hasData || isSelected ? fillColor : colors.text.tertiary}
              strokeWidth={isSelected ? 0.25 : hasData ? 0.15 : 0.2}
              strokeOpacity={hasData ? opacity : isSelected ? 0.8 : 0.4}
              onPress={() => onSelectMuscle(m.zone)}
            />
          );
        })}
      </Svg>

      {/* Legend */}
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.xs,
          marginTop: spacing.sm,
          justifyContent: "center",
          maxWidth: 300,
        }}
      >
        {ALL_ZONES.map((zone) => {
          const muscle = muscleMap.get(zone);
          const { color: zoneColor } = getMuscleStyle(muscle, colors);
          const isSelected = selectedMuscle === zone;
          const hasData = muscle && muscle.level > 0;

          return (
            <TouchableOpacity
              key={zone}
              onPress={() => onSelectMuscle(zone)}
              activeOpacity={0.7}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 3,
                backgroundColor: isSelected
                  ? `${zoneColor}20`
                  : hasData
                    ? `${zoneColor}10`
                    : "transparent",
                borderWidth: 1,
                borderColor: isSelected ? zoneColor : "transparent",
                borderRadius: 4,
                paddingHorizontal: spacing.xs,
                paddingVertical: 2,
              }}
            >
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 1,
                  backgroundColor: hasData ? zoneColor : colors.border.subtle,
                  opacity: hasData ? 0.8 : 0.4,
                }}
              />
              <Text
                style={{
                  ...typography.bodySmall,
                  color: hasData ? zoneColor : colors.text.secondary,
                  fontSize: 7,
                  opacity: hasData ? 1 : 0.5,
                  textTransform: "uppercase",
                }}
              >
                {ZONE_LABELS[zone] || zone}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Color key */}
      <View
        style={{
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.md,
          justifyContent: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 3,
              backgroundColor: colors.accent.DEFAULT,
              borderRadius: 1,
              opacity: 0.8,
            }}
          />
          <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 7 }}>
            ACTIVE
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 3,
              backgroundColor: colors.success,
              borderRadius: 1,
              opacity: 0.8,
            }}
          />
          <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 7 }}>
            DEVELOPED
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 3,
              backgroundColor: colors.bg.highlight,
              borderRadius: 1,
              opacity: 0.4,
            }}
          />
          <Text style={{ ...typography.bodySmall, color: colors.text.secondary, fontSize: 7 }}>
            UNTRACKED
          </Text>
        </View>
      </View>
    </View>
  );
}
