{ pkgs ? import <nixpkgs> {} }:
pkgs.mkShell {
  packages = [ pkgs.openssl pkgs.nodejs ];
  shellHook = ''
    export OPENSSL_DIR="${pkgs.openssl}"
    export LD_LIBRARY_PATH="${pkgs.openssl.out}/lib:$LD_LIBRARY_PATH"
  '';
}