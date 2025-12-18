
const { Midi } = require('@tonejs/midi');
const fs = require('fs');

// Create a dummy MIDI buffer with Key Signature
const midi = new Midi();
const track = midi.addTrack();
track.addNote({
    midi: 60,
    time: 0,
    duration: 0 // Test 0 duration
});

// Add Key Signature? Tonejs/midi adds it to header?
// It seems Tonejs/midi parses it, but creating it might be different.
// We can just check the property existence on an empty midi object.

console.log("Header keys:", Object.keys(midi.header));
console.log("Key Signatures:", midi.header.keySignatures);

// Test duration logic
const durationWeights = new Array(12).fill(0);
track.notes.forEach(note => {
    // defaults
    console.log("Note duration:", note.duration);
});

