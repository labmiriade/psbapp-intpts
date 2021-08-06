# Place index creation ES

Script per creare l'indice place con relativo mapping su ES

## Utilizzo

Vanno installate le dipendenze contenute nel file _requirements.txt_ prima di lanciare lo script.
Per installarle in un environment ad hoc utilizzare:

```sh
python -m venv venv  # per creare il virtual env
source venv/bin/activate  # per attivare il virtualenv
pip install -r requirements.txt  # per importare le dipendenze necessarie
```

Si digita

```bash
python ES_place_index_creation/ --endpoint endpoint_di_ES [--skills_path percorso_del_file] [--region region_di_ES] [--index-prefix prefisso_senza_dash]
```

Le opzioni sono

```bash
--endpoint
```

Obbligatorio, che specifica l'endpoint di elastic search

```bash
--region
```

Opzionale, specifica la region che ospita elastic search, se non settata utilizza quella di default dell'utente

```bash
--index-prefix
```

Opzionale, specifica il prefisso per l'indice
