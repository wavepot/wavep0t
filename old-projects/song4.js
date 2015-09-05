
module.exports = function demo(){

var bpm = 126;
var tuning = 440;
var transpose = 15;

// constants
var tau = 2 * Math.PI;

// adjust tuning to bpm
tuning *= 120 / bpm;

// scale
// C D E G A
var I   = note(0);
var II  = note(2);
var III = note(4);
var IV  = note(7);
var V   = note(9);

var chords = [
  [I, III, V],
  [II, IV, I*2],
  [III, V, II*2],
  [IV, I, III*2],
  [V/2, II, IV*2],

  [I*2, III, V],
];

var chord_pattern = [
  0, 0, 0, 0,  0, 0, 0, 1,
  3, 3, 3, 3,  3, 3, 2, 3,
  5, 5, 5, 5,  5, 5, 5, 4,
  2, 2, 2, 2,  2, 2, 1, 2
];

var kick_pattern = [
  0.6, 0.4, 2.0, 0.7,  0.6, 0.4, 2.0, 0.8,
  0.4, 0.2, 2.0, 0.7,  0.2, 0.2, 2.0, 0.8,
];

var lp_a = Moog();

return function(t) {
  t *= bpm / 120;

  // strings

  var sn = chords[sequence(1/8, chord_pattern, t)];

  var strings_osc =
    0.2 * saw(sn[0], t)
  + 0.4 * saw(sn[1], t)
  + 0.5 * sqr(sn[2], t)
  + 0.2 * saw(sn[1]*2, t)
  + 0.2 * saw(sn[0]*2.0003125, t)
  ;

  var strings = lp_a(1.35 * strings_osc, 1020, 0.2);

  var kick_osc = noise();

  var hat_osc =
    0.24 * saw(note(2, 8), t)
  + 0.6 * noise()
  ;

  var hat = sequence(1/16, kick_pattern, t)
    * perc(hat_osc, 180, 32, t);

  return 0.5 * ( // gain
  //  0.8 * strings
  + 0.8 * kick(t)
  + 0.6 * hat
  );
};

function kick(t) {
  var ts = t % (1/2);
  return Math.sin(45 * (-Math.exp(-ts * 29)));
}

function sequence(measure, seq, t) {
  return seq[(t / measure / 2 | 0) % seq.length];
}

function perc(wave, decay, sustain, t){
  return wave * Math.max(0, 1 - decay * (t / (1/8) % 1/sustain));
}

function sin(x, t) {
  return Math.sin(tau * t * x);
}

function saw(x, t) {
  return 1-2 * (t % (1/x)) * x;
}

function sqr(x, t) {
  return sin(x, t) > 0 ? 1 : -1;
}

function noise() {
  return Math.random() * 2 - 1;
}

function note(n, octave) {
  return Math.pow(2, (
    n + transpose - 33 + (12 * (octave || 0))
  ) / 12) * tuning; // A4 tuning
}

function Moog() {
  var y1, y2, y3, y4, oldx, oldy1, oldy2, oldy3;
  y1 = y2 = y3 = y4 = oldx = oldy1 = oldy2 = oldy3 = 0;

  var p, k, t1, t2, r, x;

  return function(input, cutoff, res) {
    cutoff = 2 * cutoff / 44100;
    p = cutoff * (1.8 - (0.8 * cutoff));
    k = 2 * Math.sin(cutoff * Math.PI * 0.5) - 1;
    t1 = (1 - p) * 1.386249;
    t2 = 12 + t1 * t1;
    r = res * (t2 + 6 * t1) / (t2 - 6 * t1);

    x = input - r * y4;

    // four cascaded one-pole filters (bilinear transform)
    y1 =  x * p + oldx  * p - k * y1;
    y2 = y1 * p + oldy1 * p - k * y2;
    y3 = y2 * p + oldy2 * p - k * y3;
    y4 = y3 * p + oldy3 * p - k * y4;

    // clipper band limited sigmoid
    y4 -= (y4 * y4 * y4) / 6;

    oldx = x; oldy1 = y1; oldy2 = y2; oldy3 = y3;

    return y4;
  };
}

};
