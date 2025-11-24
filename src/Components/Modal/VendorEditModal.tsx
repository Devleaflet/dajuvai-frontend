import React, { useState, useEffect, FC } from 'react';
import { Vendor, District, VendorUpdateRequest } from '../Types/vendor';
import '../../Styles/AdminVendor.css';
import '../../Styles/AddVendorModal.css';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../../config';

interface ImageUploadResponse {
  success: boolean;
  data: string;
  publicId?: string;
}

interface VendorEditModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (vendorData: Partial<VendorUpdateRequest>) => void;
  vendor: Vendor | null;
  districts?: District[];
}

const VendorEditModal: FC<VendorEditModalProps> = ({ show, onClose, onSave, vendor, districts = [] }) => {
  interface VendorFormData {
    id?: number;
    businessName: string;
    email: string;
    phoneNumber: string;
    telePhone: string;
    businessRegNumber: string;
    districtId: number;
    district: string;
    taxNumber: string;
    taxDocuments: string[];
    citizenshipDocuments: string[];
    chequePhoto: string;
    bankDetails: {
      accountName: string;
      bankName: string;
      accountNumber: string;
      bankBranch: string;
      bankCode: string;
    };
    businessAddress: string;
    profilePicture: string;
  }

  // File states for uploads
  const [taxFiles, setTaxFiles] = useState<File[]>([]);
  const [citizenshipFiles, setCitizenshipFiles] = useState<File[]>([]);
  const [chequeFile, setChequeFile] = useState<File | null>(null);
  const [profileFile, setProfileFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<VendorFormData>({
    businessName: '',
    email: '',
    phoneNumber: '',
    telePhone: '',
    businessRegNumber: '',
    districtId: 0,
    district: '',
    taxNumber: '',
    taxDocuments: [],
    citizenshipDocuments: [],
    chequePhoto: '',
    bankDetails: {
      accountName: '',
      bankName: '',
      accountNumber: '',
      bankBranch: '',
      bankCode: '',
    },
    businessAddress: '',
    profilePicture: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof VendorFormData, string>>>({});

  // File upload function
  const uploadFile = async (file: File): Promise<string> => {
    //(`Uploading file: ${file.name}`);
    const formData = new FormData();
    formData.append("file", file);
    
    // Get token from localStorage
    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    try {
      const response = await axios.post<ImageUploadResponse>(
        `${API_BASE_URL}/api/image?folder=vendor`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.data.success || !response.data.data) {
        throw new Error(`No URL returned for file: ${file.name}`);
      }
      //(`File uploaded successfully: ${file.name} -> ${response.data.data}`);
      return response.data.data;
    } catch (error: any) {
      console.error(`Failed to upload file ${file.name}:`, error.response?.data || error.message);
      throw new Error(`Failed to upload file ${file.name}: ${error.response?.data?.message || error.message}`);
    }
  };

  // File handling methods
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const files = Array.from(e.target.files || []);
    //(`File input changed for ${field}:`, files.map((f) => f.name));
    if (files.length > 0) {
      if (field === "taxDocuments") setTaxFiles((prev) => [...prev, ...files]);
      if (field === "citizenshipDocuments") setCitizenshipFiles((prev) => [...prev, ...files]);
      if (field === "chequePhoto") setChequeFile(files[0]);
      if (field === "profilePicture") setProfileFile(files[0]);
    }
  };

  const handleRemoveFile = (index: number, field: string) => {
    //(`Removing file from ${field} at index ${index}`);
    if (field === "taxDocuments") setTaxFiles((prev) => prev.filter((_, i) => i !== index));
    if (field === "citizenshipDocuments") setCitizenshipFiles((prev) => prev.filter((_, i) => i !== index));
    if (field === "chequePhoto") setChequeFile(null);
    if (field === "profilePicture") setProfileFile(null);
  };

  useEffect(() => {
    if (vendor) {
      let districtName = '';
      let districtId = 0;

      if (typeof vendor.district === 'object' && vendor.district) {
        districtId = vendor.district.id;
        districtName = vendor.district.name || '';
      } else if (typeof vendor.district === 'string') {
        districtName = vendor.district;
        const foundDistrict = districts.find(d => d.name === vendor.district);
        districtId = foundDistrict?.id || 0;
      }

      setFormData({
        id: vendor.id,
        businessName: vendor.businessName || '',
        email: vendor.email || '',
        phoneNumber: vendor.phoneNumber || '',
        telePhone: vendor.telePhone || '',
        businessRegNumber: vendor.businessRegNumber || '',
        districtId: districtId,
        district: districtName,
        taxNumber: vendor.taxNumber || '',
        taxDocuments: vendor.taxDocuments || [],
        citizenshipDocuments: vendor.citizenshipDocuments || [],
        chequePhoto: vendor.chequePhoto || '',
        bankDetails: {
          accountName: vendor.accountName || '',
          bankName: vendor.bankName || '',
          accountNumber: vendor.accountNumber || '',
          bankBranch: vendor.bankBranch || '',
          bankCode: vendor.bankCode || '',
        },
        businessAddress: vendor.businessAddress || '',
        profilePicture: vendor.profilePicture || '',
      });
    }
  }, [vendor, districts]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof VendorFormData, string>> = {};

    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business Name is required';
    }
    // Email field is disabled, so no validation needed
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone Number is required';
    }
    if (formData.districtId === 0) {
      newErrors.districtId = 'Please select a district';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name.startsWith('bankDetails.')) {
      const bankField = name.split('.')[1];
      setFormData((prev) => ({
        ...prev,
        bankDetails: {
          ...prev.bankDetails,
          [bankField]: value,
        },
      }));
    } else if (name === 'districtId') {
      const selectedDistrict = districts.find(d => d.id === parseInt(value));
      setFormData((prev) => ({
        ...prev,
        districtId: parseInt(value),
        district: selectedDistrict?.name || '',
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleDocumentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'taxDocuments' | 'citizenshipDocuments' | 'chequePhoto'
  ) => {
    const value = e.target.value.trim();
    if (!value) return;

    setFormData((prev) => {
      if (field === 'chequePhoto') {
        return {
          ...prev,
          chequePhoto: value,
        };
      } else {
        const currentArray = [...prev[field]];
        if (!currentArray.includes(value)) {
          currentArray.push(value);
        }
        return {
          ...prev,
          [field]: currentArray,
        };
      }
    });
  };

  const handleRemoveDocument = (
    field: 'taxDocuments' | 'citizenshipDocuments',
    index: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsSaving(true);
    setIsUploading(true);
    try {
      // Upload files and get URLs
      const uploadedTaxDocs = [...formData.taxDocuments];
      const uploadedCitizenshipDocs = [...formData.citizenshipDocuments];
      let uploadedChequePhoto = formData.chequePhoto;
      let uploadedProfilePicture = formData.profilePicture;

      // Upload tax documents
      for (const file of taxFiles) {
        const url = await uploadFile(file);
        uploadedTaxDocs.push(url);
      }

      // Upload citizenship documents
      for (const file of citizenshipFiles) {
        const url = await uploadFile(file);
        uploadedCitizenshipDocs.push(url);
      }

      // Upload cheque photo
      //('🔍 DEBUG: chequeFile before upload:', chequeFile);
      //('🔍 DEBUG: formData.chequePhoto before upload:', formData.chequePhoto);
      if (chequeFile) {
        uploadedChequePhoto = await uploadFile(chequeFile);
        //('🔍 DEBUG: uploadedChequePhoto after upload:', uploadedChequePhoto);
        //('🔍 DEBUG: uploadedChequePhoto type:', typeof uploadedChequePhoto);
      } else if (formData.chequePhoto) {
        uploadedChequePhoto = formData.chequePhoto;
        //('🔍 DEBUG: using existing chequePhoto:', uploadedChequePhoto);
        //('🔍 DEBUG: existing chequePhoto type:', typeof uploadedChequePhoto);
      }

      // Upload profile picture
      if (profileFile) {
        uploadedProfilePicture = await uploadFile(profileFile);
      }

      //('🔍 DEBUG: Final uploadedChequePhoto before API call:', uploadedChequePhoto);
      //('🔍 DEBUG: Final uploadedChequePhoto type:', typeof uploadedChequePhoto);
      //('🔍 DEBUG: Is uploadedChequePhoto an array?', Array.isArray(uploadedChequePhoto));

      const apiData: Partial<VendorUpdateRequest> = {
        businessName: formData.businessName,
        phoneNumber: formData.phoneNumber,
        telePhone: formData.telePhone,
        businessRegNumber: formData.businessRegNumber,
        district: formData.district,
        taxNumber: formData.taxNumber,
        businessAddress: formData.businessAddress,
        profilePicture: uploadedProfilePicture,
        accountName: formData.bankDetails.accountName,
        bankName: formData.bankDetails.bankName,
        accountNumber: formData.bankDetails.accountNumber,
        bankBranch: formData.bankDetails.bankBranch,
        bankCode: formData.bankDetails.bankCode,
        taxDocuments: uploadedTaxDocs.filter(doc => doc && doc.trim() !== '') as string[],
        citizenshipDocuments: uploadedCitizenshipDocs.filter(doc => doc && doc.trim() !== '') as string[],
        chequePhoto: uploadedChequePhoto,
      };

      //('🔍 DEBUG: apiData before cleanup:', JSON.stringify(apiData, null, 2));
      //('🔍 DEBUG: apiData.chequePhoto before cleanup:', apiData.chequePhoto);
      //('🔍 DEBUG: apiData.chequePhoto type before cleanup:', typeof apiData.chequePhoto);
      //('🔍 DEBUG: Is apiData.chequePhoto an array before cleanup?', Array.isArray(apiData.chequePhoto));

      Object.keys(apiData).forEach(key => {
        const value = (apiData as any)[key];
        //(`🔍 DEBUG: Processing key '${key}' with value:`, value, 'type:', typeof value);
        if (value === undefined || value === null || value === '') {
          //(`🔍 DEBUG: Deleting key '${key}' because it's undefined/null/empty`);
          delete (apiData as any)[key];
        }
        if (Array.isArray(value) && value.length === 0) {
          //(`🔍 DEBUG: Deleting key '${key}' because it's an empty array`);
          delete (apiData as any)[key];
        }
      });

      //('🔍 DEBUG: apiData after cleanup:', JSON.stringify(apiData, null, 2));
      //('🔍 DEBUG: Final apiData.chequePhoto:', apiData.chequePhoto);
      //('🔍 DEBUG: Final apiData.chequePhoto type:', typeof apiData.chequePhoto);
      //('🔍 DEBUG: Is final apiData.chequePhoto an array?', Array.isArray(apiData.chequePhoto));
      //('Sending API data:', apiData);
      await onSave(apiData);
    } catch (error: any) {
      console.error('Error uploading files:', error);
      toast.error(`Failed to upload files: ${error.message}`);
    } finally {
      setIsUploading(false);
      setIsSaving(false);
    }
  };

  if (!show || !vendor) return null;

  return (
    <div className="vendor-edit-modal">
      <div className="vendor-edit-modal__content">
        <div className="vendor-edit-modal__header">
          <h2 className="vendor-edit-modal__title">Edit Vendor</h2>
        </div>
        <form onSubmit={handleSubmit} className="vendor-edit-modal__form">
          <div className="vendor-edit-modal__form-group">
            <label htmlFor="businessName" className="vendor-edit-modal__label">
              Business Name
            </label>
            <input
              type="text"
              id="businessName"
              name="businessName"
              value={formData.businessName || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
            {errors.businessName && <p className="vendor-edit-modal__error">{errors.businessName}</p>}
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="email" className="vendor-edit-modal__label">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
              disabled
            />
            {errors.email && <p className="vendor-edit-modal__error">{errors.email}</p>}
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="phoneNumber" className="vendor-edit-modal__label">
              Phone Number
            </label>
            <input
              type="text"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
            {errors.phoneNumber && <p className="vendor-edit-modal__error">{errors.phoneNumber}</p>}
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="telePhone" className="vendor-edit-modal__label">
              Telephone
            </label>
            <input
              type="text"
              id="telePhone"
              name="telePhone"
              value={formData.telePhone || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="businessRegNumber" className="vendor-edit-modal__label">
              Business Registration Number
            </label>
            <input
              type="text"
              id="businessRegNumber"
              name="businessRegNumber"
              value={formData.businessRegNumber || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="districtId" className="vendor-edit-modal__label">
              District
            </label>
            <select
              id="districtId"
              name="districtId"
              value={formData.districtId || 0}
              onChange={handleChange}
              className="vendor-edit-modal__select"
            >
              <option value={0}>Select District</option>
              {districts.map((district) => (
                <option key={district.id} value={district.id}>
                  {district.name}
                </option>
              ))}
            </select>
            {errors.districtId && <p className="vendor-edit-modal__error">{errors.districtId}</p>}
            {formData.district && (
              <p className="vendor-edit-modal__label">
                Selected: {formData.district}
              </p>
            )}
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="taxNumber" className="vendor-edit-modal__label">
              Tax Number
            </label>
            <input
              type="text"
              id="taxNumber"
              name="taxNumber"
              value={formData.taxNumber || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>

          <div className="vendor-edit-modal__form-group">
            <label className="vendor-edit-modal__label">
              Tax Documents
            </label>
            <div className="document-section">
              <div className="document-container">
                <div className="document-item file-upload">
                  <label htmlFor="taxDocuments" className="file-label">
                    Choose Files
                  </label>
                  <input
                    type="file"
                    id="taxDocuments"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "taxDocuments")}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {/* Show new files to be uploaded */}
              {taxFiles.length > 0 && (
                <div className="file-list">
                  <p className="vendor-edit-modal__label">New Files to Upload:</p>
                  {taxFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveFile(index, "taxDocuments")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Show existing documents */}
              {formData.taxDocuments && formData.taxDocuments.length > 0 && (
                <div className="vendor-edit-modal__document-list">
                  <p className="vendor-edit-modal__label">Current Documents:</p>
                  {formData.taxDocuments.map((doc, index) => (
                    <div key={index} className="vendor-edit-modal__document-item">
                      <a
                        href={doc}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vendor-edit-modal__document-link"
                      >
                        Document {index + 1}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveDocument('taxDocuments', index)}
                        className="vendor-edit-modal__document-remove"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="vendor-edit-modal__form-group">
            <label className="vendor-edit-modal__label">
              Citizenship Documents (Optional)
            </label>
            <div className="document-section">
              <div className="document-container">
                <div className="document-item file-upload">
                  <label htmlFor="citizenshipDocuments" className="file-label">
                    Choose Files
                  </label>
                  <input
                    type="file"
                    id="citizenshipDocuments"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "citizenshipDocuments")}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {/* Show new files to be uploaded */}
              {citizenshipFiles.length > 0 && (
                <div className="file-list">
                  <p className="vendor-edit-modal__label">New Files to Upload:</p>
                  {citizenshipFiles.map((file, index) => (
                    <div key={index} className="file-item">
                      <span className="file-name">{file.name}</span>
                      <button
                        type="button"
                        className="remove-btn"
                        onClick={() => handleRemoveFile(index, "citizenshipDocuments")}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {/* Show existing documents */}
               {formData.citizenshipDocuments && formData.citizenshipDocuments.length > 0 && (
                 <div className="vendor-edit-modal__document-list">
                   <p className="vendor-edit-modal__label">Current Documents:</p>
                   {formData.citizenshipDocuments.map((doc, index) => (
                     <div key={index} className="vendor-edit-modal__document-item">
                       <a
                         href={doc}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="vendor-edit-modal__document-link"
                       >
                         Document {index + 1}
                       </a>
                       <button
                         type="button"
                         onClick={() => handleRemoveDocument('citizenshipDocuments', index)}
                         className="vendor-edit-modal__document-remove"
                       >
                         Remove
                       </button>
                     </div>
                   ))}
                 </div>
               )}
             </div>
           </div>

          <div className="vendor-edit-modal__form-group">
            <label className="vendor-edit-modal__label">
              Cheque Photo
            </label>
            <div className="document-section">
              <div className="document-container">
                <div className="document-item file-upload">
                  <label htmlFor="chequePhoto" className="file-label">
                    Choose File
                  </label>
                  <input
                    type="file"
                    id="chequePhoto"
                    accept="image/*,application/pdf"
                    onChange={(e) => handleFileChange(e, "chequePhoto")}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {/* Show new file to be uploaded */}
              {chequeFile && (
                <div className="file-list">
                  <p className="vendor-edit-modal__label">New File to Upload:</p>
                  <div className="file-item">
                    <span className="file-name">{chequeFile.name}</span>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveFile(0, "chequePhoto")}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              {/* Show existing cheque photo */}
              {formData.chequePhoto && !chequeFile && (
                <div className="vendor-edit-modal__document-list">
                  <p className="vendor-edit-modal__label">Current Cheque Photo:</p>
                  <div className="vendor-edit-modal__document-item">
                    <a
                      href={formData.chequePhoto}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vendor-edit-modal__document-link"
                    >
                      View Cheque Photo
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="vendor-edit-modal__section-title">
            Bank Details
          </div>
          <div className="vendor-edit-modal__form-group">
            <label htmlFor="bankDetails.accountName" className="vendor-edit-modal__label">
              Account Name
            </label>
            <input
              type="text"
              id="bankDetails.accountName"
              name="bankDetails.accountName"
              value={formData.bankDetails?.accountName || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>
          <div className="vendor-edit-modal__form-group">
            <label htmlFor="bankDetails.bankName" className="vendor-edit-modal__label">
              Bank Name
            </label>
            <input
              type="text"
              id="bankDetails.bankName"
              name="bankDetails.bankName"
              value={formData.bankDetails?.bankName || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>
          <div className="vendor-edit-modal__form-group">
            <label htmlFor="bankDetails.accountNumber" className="vendor-edit-modal__label">
              Account Number
            </label>
            <input
              type="text"
              id="bankDetails.accountNumber"
              name="bankDetails.accountNumber"
              value={formData.bankDetails?.accountNumber || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>
          <div className="vendor-edit-modal__form-group">
            <label htmlFor="bankDetails.bankBranch" className="vendor-edit-modal__label">
              Bank Branch
            </label>
            <input
              type="text"
              id="bankDetails.bankBranch"
              name="bankDetails.bankBranch"
              value={formData.bankDetails?.bankBranch || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>
          <div className="vendor-edit-modal__form-group">
            <label htmlFor="bankDetails.bankCode" className="vendor-edit-modal__label">
              Bank Code
            </label>
            <input
              type="text"
              id="bankDetails.bankCode"
              name="bankDetails.bankCode"
              value={formData.bankDetails?.bankCode || ''}
              onChange={handleChange}
              className="vendor-edit-modal__input"
            />
          </div>

          <div className="vendor-edit-modal__form-group">
            <label htmlFor="businessAddress" className="vendor-edit-modal__label">
              Business Address
            </label>
            <textarea
              id="businessAddress"
              name="businessAddress"
              value={formData.businessAddress || ''}
              onChange={handleChange}
              className="vendor-edit-modal__textarea"
              rows={4}
            />
          </div>

          <div className="vendor-edit-modal__form-group">
            <label className="vendor-edit-modal__label">
              Profile Picture
            </label>
            <div className="document-section">
              <div className="document-container">
                <div className="document-item file-upload">
                  <label htmlFor="profilePicture" className="file-label">
                    Choose File
                  </label>
                  <input
                    type="file"
                    id="profilePicture"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, "profilePicture")}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
              {/* Show new file to be uploaded */}
              {profileFile && (
                <div className="file-list">
                  <p className="vendor-edit-modal__label">New File to Upload:</p>
                  <div className="file-item">
                    <span className="file-name">{profileFile.name}</span>
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => handleRemoveFile(0, "profilePicture")}
                    >
                      ×
                    </button>
                  </div>
                </div>
              )}
              {/* Show existing profile picture */}
              {formData.profilePicture && !profileFile && (
                <div className="vendor-edit-modal__document-list">
                  <p className="vendor-edit-modal__label">Current Profile Picture:</p>
                  <div className="vendor-edit-modal__document-item">
                    <a
                      href={formData.profilePicture}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vendor-edit-modal__document-link"
                    >
                      View Profile Picture
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="vendor-edit-modal__actions">
            <button
              type="button"
              onClick={onClose}
              className="vendor-edit-modal__button vendor-edit-modal__button--cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="vendor-edit-modal__button vendor-edit-modal__button--save"
              disabled={isSaving || isUploading}
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VendorEditModal;