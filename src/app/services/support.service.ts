import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { throwError as observableThrowError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { environment } from '../../environments/environment';

@Injectable()
export class SupportService {
  public SUPPORT_BUNDLE_URL = environment.BASE_URL + 'support';

  constructor(private http: HttpClient) { }

  /**
   *  GET | /foglamp/support
   */
  public get() {
    return this.http.get(this.SUPPORT_BUNDLE_URL).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }

  /**
   *  POST | /foglamp/support
   */
  public post() {
    return this.http.post(this.SUPPORT_BUNDLE_URL, null).pipe(
      map(response => response),
      catchError((error: Response) => observableThrowError(error)));
  }
}
