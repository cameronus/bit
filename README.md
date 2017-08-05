# bit
A secure, end-to-end encrypted text snippet transmission system.

## Summary
Bit is a utility which allows the transmission of text snippets securely through shortened links. These snippets of text can be created either in plaintext or encrypted with triplesec, a symmetric encryption library which combines the Salsa 20, AES, and Twofish ciphers. Each bit also has the option to be stored permanently at the shortened URL, otherwise they will be deleted after the first viewing. This utility can be used to send passwords, or other sensitive data. In addition, bit is able to parse Github-style markdown, so it can be used to host READMEs and other documentation.

## Security
Bit is end-to-end encrypted with triplesec. The combination of Salsa 20, AES, and Twofish allows for any two of the ciphers to be broken without compromising the data. Maintained by keybase, this encryption library uses cryptographically secure random number generators and HMAC signatures to provide IND-CCA2 secure encryption. Your raw data is never sent to the server, only a bcrypt hash of your key and the encrypted data. A diagram of the cryptographic scheme will be available soon.

## Author
Cameron Jones (cameronus)
