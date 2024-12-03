```bash
# Generate a Root Certificate (CA)
openssl genrsa -out root.key 2048
openssl req -x509 -new -nodes -key root.key -sha256 -days 365 -out root.crt -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=RootCA"

# Generate a Client Key
openssl genrsa -out slonik.key 2048

# Create a Certificate Signing Request (CSR) for the Client
openssl req -new -key slonik.key -out slonik.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=Client"

# Sign the Client Certificate with the Root Certificate
openssl x509 -req -in slonik.csr -CA root.crt -CAkey root.key -CAcreateserial -out slonik.crt -days 365 -sha256

# Verify the Certificates
openssl verify -CAfile root.crt slonik.crt
```