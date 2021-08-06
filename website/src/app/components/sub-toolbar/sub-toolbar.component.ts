import { Component } from '@angular/core';

@Component({
  selector: 'app-sub-toolbar',
  templateUrl: './sub-toolbar.component.html',
  styleUrls: ['./sub-toolbar.component.scss'],
})
export class SubToolbarComponent {
  logos = [
    {
      name: 'Comune di Schio',
      logo: '/assets/logos/logo-schio.jpeg',
      site: 'http://www.comune.schio.vi.it/web/schio/',
    },
    {
      name: 'Comune di Thiene',
      logo: '/assets/logos/logo-thiene.jpeg',
      site: 'https://www.comune.thiene.vi.it/myportal/C_L157/home',
    },
    {
      name: 'Comune di Valdagno',
      logo: '/assets/logos/logo-valdagno.jpeg',
      site: 'https://www.comune.valdagno.vi.it/',
    },
    {
      name: 'Comune di Isola Vicentina',
      logo: '/assets/logos/logo-isola-vicentina.jpeg',
      site: 'http://www.comune.isola-vicentina.vi.it/web/isolavicentina/',
    },
    {
      name: 'Comune di Malo',
      logo: '/assets/logos/logo-malo.jpeg',
      site: 'http://www.comune.malo.vi.it/web/malo/',
    },
    {
      name: 'Comune di Marano Vicentino',
      logo: '/assets/logos/logo-marano.jpeg',
      site: 'https://www.comune.marano.vi.it/hh/index.php?jvs=0&acc=1',
    },
    {
      name: 'Comune di Monte di Malo',
      logo: '/assets/logos/logo-monte-di-malo.jpeg',
      site: 'http://www.comune.montedimalo.vi.it/web/montedimalo/',
    },
    {
      name: 'Comune di Santorso',
      logo: '/assets/logos/logo-santorso.png',
      site: 'http://www.comune.santorso.vi.it/web/santorso/',
    },
    {
      name: 'Comune di San Vito di Leguzzano',
      logo: '/assets/logos/logo-san-vito.jpeg',
      site: 'http://www.comune.sanvitodileguzzano.vi.it/web/svleguzzano/',
    },
    {
      name: 'Comune di Torrebelvicino',
      logo: '/assets/logos/logo-torrebelvicino.jpeg',
      site: 'http://www.comune.torrebelvicino.vi.it/web/torrebelvicino/',
    },
    {
      name: 'Comune di Villaverla',
      logo: '/assets/logos/logo-villaverla.jpeg',
      site: 'http://www.comune.villaverla.vi.it/web/villaverla/',
    },
    {
      name: 'Comune di Zugliano',
      logo: '/assets/logos/logo-zugliano.jpeg',
      site: 'http://www.comune.zugliano.vi.it/web/zugliano/',
    },
  ];
}
