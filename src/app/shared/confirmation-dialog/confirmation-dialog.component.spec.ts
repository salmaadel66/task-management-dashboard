import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import {
  ConfirmationDialogComponent,
  ConfirmationDialogData,
} from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmationDialogComponent>;
  let keydown$: Subject<KeyboardEvent>;
  let dialogRef: { close: ReturnType<typeof vi.fn>; keydownEvents: () => Subject<KeyboardEvent> };

  const data: ConfirmationDialogData = {
    title: 'DELETE_TASK',
    message: 'Are you sure you want to delete "Write tests"?',
    confirmText: 'DELETE',
  };

  beforeEach(async () => {
    keydown$ = new Subject<KeyboardEvent>();
    dialogRef = { close: vi.fn(), keydownEvents: () => keydown$ };

    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent],
      providers: [
        provideTranslateService(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    await fixture.whenStable();
  });

  const buttons = () =>
    Array.from(fixture.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];

  it('should render the title, message and confirm text', () => {
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('h2')?.textContent).toContain(data.title);
    expect(el.querySelector('.c-confirm__message')?.textContent).toContain(data.message);
    expect(buttons()[1].textContent).toContain(data.confirmText);
  });

  it('should close with true when confirm is clicked', () => {
    buttons()[1].click();

    expect(dialogRef.close).toHaveBeenCalledWith(true);
  });

  it('should close with false when cancel is clicked', () => {
    buttons()[0].click();

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should close with false when Escape is pressed', () => {
    keydown$.next(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(dialogRef.close).toHaveBeenCalledWith(false);
  });

  it('should ignore Escape when a modifier key is held', () => {
    keydown$.next(new KeyboardEvent('keydown', { key: 'Escape', shiftKey: true }));

    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('should ignore other keys', () => {
    keydown$.next(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(dialogRef.close).not.toHaveBeenCalled();
  });
});
