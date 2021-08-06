import { ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import * as maplibregl from 'maplibre-gl';
import { Signer } from '@aws-amplify/core';
import {
  CognitoIdentityClient,
  Credentials,
  GetCredentialsForIdentityCommand,
  GetIdCommand,
} from '@aws-sdk/client-cognito-identity'; // ES Modules import
import { from } from 'rxjs';
import { EnvironmentService } from 'src/app/core/services/environment.service';
import { Environment } from 'src/app/core/interfaces/environment.interface';
import { take } from 'rxjs/operators';

@Component({
  selector: 'app-aws-map-viewer',
  templateUrl: './aws-map-viewer.component.html',
  styleUrls: ['./aws-map-viewer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwsMapViewerComponent implements OnInit, OnChanges {
  @Input() center: maplibregl.LngLatLike = [11.477778, 45.708333];
  @Input() zoomToPins = false;
  @Input() pins: Pin[] | null = [];
  @Input() zoom: number = 10;

  private _markers: maplibregl.Marker[];

  client: CognitoIdentityClient;
  map?: maplibregl.Map;

  constructor(private envService: EnvironmentService) {
    this._markers = [];
    this.client = new CognitoIdentityClient({ region: this.environment.awsRegion });
  }

  get environment(): Environment {
    return this.envService.environment;
  }

  ngOnInit(): void {
    if (this.supported) {
      from(this.getCredentials())
        .pipe(take(1))
        .subscribe((response) => {
          const fn = (url: string, resourceType: string) =>
            transformRequest(this.environment.awsRegion, url, resourceType, response);
          // Initialize the map
          this.map = new maplibregl.Map({
            container: 'map',
            center: this.center, // initial map centerpoint
            zoom: this.zoom, // initial map zoom
            style: this.environment.awsMapName,
            transformRequest: fn,
          });

          this.map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
          this.map.addControl(new maplibregl.NavigationControl({ showZoom: false }), 'bottom-right');
          this.resetMarkers();
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.map) {
      if (changes.center && changes.center.previousValue !== changes.center.currentValue) {
        this.map.setCenter(this.center);
      }
      if (changes.pins && changes.pins.previousValue !== changes.pins.currentValue) {
        this.resetMarkers();
      }
    }
  }

  get supported(): boolean {
    return maplibregl.supported();
  }

  private resetMarkers(): void {
    for (const marker of this._markers) {
      marker.remove();
    }
    this._markers = [];
    const bounds = new maplibregl.LngLatBounds();
    for (const pin of this.pins || []) {
      bounds.extend(pin.pos);
      this.addMarker(pin);
    }
    if (this.map && this.zoomToPins) {
      this.map.fitBounds(bounds, {
        maxZoom: this.zoom,
        linear: true,
        padding: 64,
      });
    }
  }

  private addMarker(pin: Pin): void {
    if (!this.map) {
      return;
    }
    const marker = new maplibregl.Marker({ color: '#d74027' }).setLngLat(pin.pos).addTo(this.map);
    if (pin.text) {
      let popup = new maplibregl.Popup({ offset: 25 }).setText(pin.text);
      if (pin.href) {
        popup.setHTML('<a href="details/' + pin.href + '">' + pin.text + '</a>');
      }
      marker.setPopup(popup);
    }
    this._markers.push(marker);
  }

  async getCredentials(): Promise<Credentials | undefined> {
    const commandId = new GetIdCommand({
      IdentityPoolId: this.environment.awsIdentityPoolId,
    });
    const identity = await this.client.send(commandId);
    const command = new GetCredentialsForIdentityCommand({
      IdentityId: identity.IdentityId,
    });
    const credentials = await this.client.send(command);
    return credentials.Credentials;
  }
}

function transformRequest(region: string, url: string, resourceType: string, credentials: Credentials | undefined) {
  if (resourceType === 'Style' && !url.includes('://')) {
    // resolve to an AWS URL
    url = `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${url}/style-descriptor`;
  }

  if (url.includes('amazonaws.com') && credentials) {
    // only sign AWS requests (with the signature as part of the query string)
    return {
      url: Signer.signUrl(url, {
        access_key: credentials.AccessKeyId,
        secret_key: credentials.SecretKey,
        session_token: credentials.SessionToken,
      }),
    };
  }

  // don't sign
  return { url };
}

export interface Pin {
  pos: maplibregl.LngLatLike;
  text?: string;
  href?: string;
}
