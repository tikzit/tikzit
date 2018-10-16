{ nixpkgs ? import <nixpkgs> {} }:

nixpkgs.pkgs.libsForQt5.callPackage ./tikzit.nix {}
