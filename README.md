# bit
A secure, end-to-end encrypted text snippet transmission system.

## Summary
Bit is a utility which allows the transmission of text snippets securely through shortened links. These snippets of text can be created either in plaintext or encrypted with triplesec, a symmetric encryption library which combines the Salsa 20, AES, and Twofish ciphers. Each bit also has the option to be stored permanently at the shortened URL, otherwise they will be deleted after the first viewing. This utility can be used to send passwords, or other sensitive data. In addition, bit is able to parse Github-style markdown, so it can be used to host READMEs and other documentation.

On the main page of the bit utility, there is a red lock icon button, and a green lock icon button. The red lock indicates the creation an unencrypted bit which will be stored in plaintext, while the green lock indicates the creation of an end-to-end encrypted bit.

An unencrypted bit may look like this in the database:
```
<p>I am an unencrypted bit.</p>
```

An encrypted bit may look like this in the database:
```
1c94d7de00000003932d4cbaa55c7501d53624ea9bf5a17a55148a7bf74f70ace185202fed61b460cdfde2dc99977f239eb0af32f46e17c800dc37c9e9ebeb366a8a77752f098d3bd888f2db728df16ead979fa1732ec9c209c29e86736344257707184bda5c3fca008e82ba9b730645077487cb8e80446d61642dce73f8ee19544c421cbb250eb1a33c6ea9b3eb0c98f6e89212830744f504bd0424c39c1246724aad268011b5ab2b21f40bacee08925c22f2039f132686d6cc44a7e27a721e74865345bfc535820ba4dbb9c8e83cacfe7bc4dc759ba7e245da6721539a47e586d88050b452002b6bcf13dd1d9b
```

## Security
Bit is end-to-end encrypted with triplesec. The combination of Salsa 20, AES, and Twofish allows for any two of the ciphers to be broken without compromising the data. Maintained by keybase, this encryption library uses cryptographically secure random number generators and HMAC signatures to provide IND-CCA2 secure encryption. Your raw data is never sent to the server, only a bcrypt hash of your key and the encrypted data. The diagram below shows in detail how the data is handled.

## Diagram
![Crytographic Diagram](http://i.imgur.com/u8kV4qy.png)

## Website
Bit is currently not live.

## Author
Cameron Jones (cameronus)
