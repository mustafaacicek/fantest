import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CountryService } from '../../../services/country.service';
import { Country } from '../../../models/country.model';

@Component({
  selector: 'app-country',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './country.component.html',
  styleUrls: ['./country.component.scss']
})
export class CountryComponent implements OnInit {
  countries: Country[] = [];
  countryForm: FormGroup;
  isEditMode = false;
  currentCountryId: number | null = null;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showForm = false;

  constructor(
    private countryService: CountryService,
    private fb: FormBuilder
  ) {
    this.countryForm = this.fb.group({
      name: ['', [Validators.required]],
      shortCode: ['', [Validators.required, Validators.maxLength(2)]],
      logoUrl: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCountries();
  }

  loadCountries(): void {
    this.isLoading = true;
    this.countryService.getAllCountries().subscribe({
      next: (data) => {
        this.countries = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Ülke listesi yüklenirken bir hata oluştu.';
        this.isLoading = false;
        console.error('Error loading countries:', error);
      }
    });
  }

  openAddForm(): void {
    this.isEditMode = false;
    this.currentCountryId = null;
    this.countryForm.reset();
    this.showForm = true;
  }

  openEditForm(country: Country): void {
    this.isEditMode = true;
    this.currentCountryId = country.id!;
    this.countryForm.patchValue({
      name: country.name,
      shortCode: country.shortCode,
      logoUrl: country.logoUrl
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.countryForm.reset();
  }

  onSubmit(): void {
    if (this.countryForm.invalid) {
      this.countryForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const countryData: Country = this.countryForm.value;

    if (this.isEditMode && this.currentCountryId) {
      // Update existing country
      this.countryService.updateCountry(this.currentCountryId, countryData).subscribe({
        next: (updatedCountry) => {
          this.successMessage = 'Ülke başarıyla güncellendi.';
          this.isLoading = false;
          this.showForm = false;
          this.loadCountries();
        },
        error: (error) => {
          this.errorMessage = 'Ülke güncellenirken bir hata oluştu.';
          this.isLoading = false;
          console.error('Error updating country:', error);
        }
      });
    } else {
      // Create new country
      this.countryService.createCountry(countryData).subscribe({
        next: (newCountry) => {
          this.successMessage = 'Yeni ülke başarıyla eklendi.';
          this.isLoading = false;
          this.showForm = false;
          this.loadCountries();
        },
        error: (error) => {
          this.errorMessage = 'Ülke eklenirken bir hata oluştu.';
          this.isLoading = false;
          console.error('Error creating country:', error);
        }
      });
    }
  }

  deleteCountry(id: number): void {
    if (confirm('Bu ülkeyi silmek istediğinizden emin misiniz?')) {
      this.isLoading = true;
      this.countryService.deleteCountry(id).subscribe({
        next: () => {
          this.successMessage = 'Ülke başarıyla silindi.';
          this.isLoading = false;
          this.loadCountries();
        },
        error: (error) => {
          this.errorMessage = 'Ülke silinirken bir hata oluştu.';
          this.isLoading = false;
          console.error('Error deleting country:', error);
        }
      });
    }
  }

  // Helper methods for form validation
  get nameControl() { return this.countryForm.get('name'); }
  get shortCodeControl() { return this.countryForm.get('shortCode'); }
  get logoUrlControl() { return this.countryForm.get('logoUrl'); }
}
