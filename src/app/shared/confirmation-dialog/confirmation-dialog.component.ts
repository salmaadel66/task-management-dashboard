import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { hasModifierKey } from '@angular/cdk/keycodes';
import { filter } from 'rxjs';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText: string;
}

@Component({
  selector: 'app-confirmation-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatIconModule, TranslateModule],
  templateUrl: './confirmation-dialog.component.html',
  styleUrl: './confirmation-dialog.component.scss',
})
export class ConfirmationDialogComponent {
  private dialogRef = inject(MatDialogRef<ConfirmationDialogComponent, boolean>);
  data: ConfirmationDialogData = inject(MAT_DIALOG_DATA);

  constructor() {
    this.dialogRef
      .keydownEvents()
      .pipe(filter((event) => event.key === 'Escape' && !hasModifierKey(event)))
      .subscribe(() => this.onCancel());
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
