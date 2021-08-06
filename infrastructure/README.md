# Infrastruttura di PSBAPP IntPts

L'infrastruttura è gestita con [AWS CDK](https://docs.aws.amazon.com/cdk/api/latest/docs/).

## Stack Personale

Ogni utente ha a disposizione uno stack personale in cui fare test e prove.
Lo stack si chiama `PSBAPPIntPtsDev${ncognome}` e la responsabilità di deploy e tenere allineato è del singolo sviluppatore (così non interferisce con eventuali modifiche allo stack main).

Per fare un deploy (sia il primo che eventuali aggiornamenti) lanciare dalla cartella root:

```sh
./deploy.sh PSBAPPIntPtsDev<ncognome>
```

## Comandi utili

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npm run deploy -- <stack-name>` deploy this stack to your default AWS account/region
- `npm run diff -- <stack-name>` compare deployed stack with current state
- `npm run cdk -- <any cdk command> <any argument>` per lanciare comandi di cdk
